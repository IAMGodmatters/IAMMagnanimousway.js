package com.magnanimous.drivetv;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class PhotoActivity extends Activity {
  private final ExecutorService decode = Executors.newSingleThreadExecutor();
  private ArrayList<String> uris;
  private ArrayList<String> names;
  private ImageView picture;
  private TextView caption;
  private int index;
  private int generation;
  private boolean zoom;
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    uris = getIntent().getStringArrayListExtra("uris");
    names = getIntent().getStringArrayListExtra("names");
    if (uris == null || uris.isEmpty()) { finish(); return; }
    if (names == null || names.size() != uris.size()) names = new ArrayList<>(uris);
    index = Math.max(0, Math.min(uris.size() - 1, getIntent().getIntExtra("selected_index", 0)));
    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setBackgroundColor(0xff081626); root.setPadding(10, 8, 10, 8);
    caption = new TextView(this);
    caption.setTextColor(0xffeaf3ff); caption.setTextSize(18); caption.setPadding(10, 8, 10, 8);
    root.addView(caption);
    picture = new ImageView(this); picture.setScaleType(ImageView.ScaleType.FIT_CENTER);
    root.addView(picture, new LinearLayout.LayoutParams(-1, 0, 1));
    LinearLayout buttons = new LinearLayout(this);
    Button prev = new Button(this); prev.setText("◀ Previous"); prev.setAllCaps(false);
    prev.setOnClickListener(v -> show(Math.max(0, index - 1)));
    buttons.addView(prev, new LinearLayout.LayoutParams(0, -2, 1));
    Button fit = new Button(this); fit.setText("Fit / Fill"); fit.setAllCaps(false);
    fit.setOnClickListener(v -> {
      zoom = !zoom;
      picture.setScaleType(zoom ? ImageView.ScaleType.CENTER_CROP : ImageView.ScaleType.FIT_CENTER);
    });
    buttons.addView(fit, new LinearLayout.LayoutParams(0, -2, 1));
    Button next = new Button(this); next.setText("Next ▶"); next.setAllCaps(false);
    next.setOnClickListener(v -> show(Math.min(uris.size() - 1, index + 1)));
    buttons.addView(next, new LinearLayout.LayoutParams(0, -2, 1));
    root.addView(buttons); setContentView(root); show(index);
  }
  private void show(int newIndex) {
    index = newIndex;
    int task = ++generation;
    caption.setText("Loading • " + (index + 1) + " / " + uris.size() + "   " + names.get(index));
    picture.setImageDrawable(null);
    Uri selected = Uri.parse(uris.get(index));
    decode.execute(() -> {
      Bitmap result = null;
      try {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        try (InputStream in = getContentResolver().openInputStream(selected)) {
          if (in != null) BitmapFactory.decodeStream(in, null, bounds);
        }
        BitmapFactory.Options opts = new BitmapFactory.Options();
        int divisor = 1;
        while (bounds.outWidth / divisor > 1920 || bounds.outHeight / divisor > 1080) divisor *= 2;
        opts.inSampleSize = Math.max(1, divisor);
        try (InputStream in = getContentResolver().openInputStream(selected)) {
          if (in != null) result = BitmapFactory.decodeStream(in, null, opts);
        }
      } catch (Exception ignored) {}
      final Bitmap image = result;
      runOnUiThread(() -> {
        if (isFinishing() || isDestroyed() || generation != task) {
          if (image != null) image.recycle();
          return;
        }
        if (image == null) caption.setText("Unable to display photo: unsupported format or unavailable file.");
        else {
          picture.setImageBitmap(image);
          caption.setText((index + 1) + " / " + uris.size() + "   " + names.get(index));
        }
      });
    });
  }
  @Override protected void onDestroy() { generation++; decode.shutdownNow(); super.onDestroy(); }
}
