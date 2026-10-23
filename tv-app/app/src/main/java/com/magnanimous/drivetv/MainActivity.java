package com.magnanimous.drivetv;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
  private static final int PICK_MEDIA = 101, PICK_FOLDER = 102;
  private LinearLayout items;
  private TextView status;
  private Uri tree;
  private String documentId;
  private boolean viewingFolder = false;
  private final ArrayList<String> folderStack = new ArrayList<>();

  static final class Entry {
    final Uri uri;
    final String name;
    final String mime;
    Entry(Uri uri, String name, String mime) {
      this.uri = uri; this.name = name; this.mime = mime == null ? "" : mime;
    }
    boolean picture() {
      String n = name.toLowerCase(Locale.ROOT);
      return mime.startsWith("image/") || n.matches(".*\\.(jpg|jpeg|png|webp|gif|bmp|heic)$");
    }
    boolean media() {
      String n = name.toLowerCase(Locale.ROOT);
      return mime.startsWith("audio/") || mime.startsWith("video/") ||
          n.matches(".*\\.(mp4|m4v|mkv|webm|mov|3gp|ts|mpeg|mpg|mp3|m4a|aac|flac|wav|ogg|opus|wma|aiff)$");
    }
    boolean audio() {
      String n = name.toLowerCase(Locale.ROOT);
      return mime.startsWith("audio/") ||
          n.matches(".*\\.(mp3|m4a|aac|flac|wav|ogg|opus|wma|aiff)$");
    }
  }

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    draw();
    String saved = getPreferences(0).getString("folder", null);
    if (saved != null) {
      try {
        tree = Uri.parse(saved);
        documentId = DocumentsContract.getTreeDocumentId(tree);
        showFolder();
      } catch (RuntimeException ex) { showRecent(); }
    } else showRecent();
  }
  private int color(String hex) { return android.graphics.Color.parseColor(hex); }
  private TextView label(String text, int size) {
    TextView v = new TextView(this);
    v.setText(text); v.setTextSize(size); v.setTextColor(color("#EAF3FF"));
    v.setPadding(12, 12, 12, 12);
    return v;
  }
  private Button button(String label) {
    Button b = new Button(this);
    b.setText(label); b.setAllCaps(false); b.setTextSize(15);
    b.setFocusable(true);
    return b;
  }
  private void draw() {
    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setPadding(18, 12, 18, 12);
    root.setBackgroundColor(color("#081626"));
    root.addView(label("MAGNANIMOUS  •  DRIVE TV", 25));
    status = label("Your videos, songs, and photos  •  free personal TV edition", 14);
    root.addView(status);
    LinearLayout buttons = new LinearLayout(this);
    buttons.setOrientation(LinearLayout.HORIZONTAL);
    Button choose = button("Choose video / song / photo");
    choose.setOnClickListener(v -> pickMedia());
    buttons.addView(choose, new LinearLayout.LayoutParams(0, -2, 2));
    Button folder = button("Choose folder");
    folder.setOnClickListener(v -> pickFolder());
    buttons.addView(folder, new LinearLayout.LayoutParams(0, -2, 1));
    root.addView(buttons);
    LinearLayout nav = new LinearLayout(this);
    nav.setOrientation(LinearLayout.HORIZONTAL);
    Button recent = button("Recent media");
    recent.setOnClickListener(v -> showRecent());
    nav.addView(recent, new LinearLayout.LayoutParams(0, -2, 1));
    Button drive = button("Google Drive website");
    drive.setOnClickListener(v -> openDrive());
    nav.addView(drive, new LinearLayout.LayoutParams(0, -2, 1));
    root.addView(nav);
    ScrollView scroll = new ScrollView(this);
    items = new LinearLayout(this);
    items.setOrientation(LinearLayout.VERTICAL);
    scroll.addView(items);
    root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
    setContentView(root);
  }
  private void hint(String message) { status.setText(message); }
  private void pickMedia() {
    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    i.addCategory(Intent.CATEGORY_OPENABLE);
    i.setType("*/*");
    i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"video/*", "audio/*", "image/*"});
    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    try { startActivityForResult(i, PICK_MEDIA); }
    catch (ActivityNotFoundException ex) {
      hint("This TV has no compatible Android file picker. You can try a file manager from its Play Store.");
    }
  }
  private void pickFolder() {
    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    try { startActivityForResult(i, PICK_FOLDER); }
    catch (ActivityNotFoundException ex) {
      hint("This TV does not support selecting a folder. Choose individual media instead.");
    }
  }
  @Override protected void onActivityResult(int request, int result, Intent data) {
    super.onActivityResult(request, result, data);
    if (result != RESULT_OK || data == null || data.getData() == null) return;
    Uri selected = data.getData();
    try { getContentResolver().takePersistableUriPermission(selected, Intent.FLAG_GRANT_READ_URI_PERMISSION); }
    catch (SecurityException | IllegalArgumentException ignored) {}
    if (request == PICK_MEDIA) {
      Entry entry = new Entry(selected, getDisplayName(selected), getContentResolver().getType(selected));
      remember(entry);
      openEntry(entry, java.util.Collections.singletonList(entry));
    } else if (request == PICK_FOLDER) {
      tree = selected;
      documentId = DocumentsContract.getTreeDocumentId(tree);
      folderStack.clear();
      getPreferences(0).edit().putString("folder", tree.toString()).apply();
      showFolder();
    }
  }
  private String getDisplayName(Uri uri) {
    try (Cursor c = getContentResolver().query(uri,
        new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
      if (c != null && c.moveToFirst() && c.getString(0) != null) return c.getString(0);
    } catch (RuntimeException ignored) {}
    return "Selected media";
  }
  private void remember(Entry entry) {
    try {
      JSONArray saved = new JSONArray(getPreferences(0).getString("recent", "[]"));
      JSONArray recent = new JSONArray();
      JSONObject fresh = new JSONObject();
      fresh.put("uri", entry.uri.toString());
      fresh.put("name", entry.name);
      fresh.put("mime", entry.mime);
      recent.put(fresh);
      for (int i = 0; i < saved.length() && recent.length() < 24; i++) {
        JSONObject o = saved.optJSONObject(i);
        if (o != null && !entry.uri.toString().equals(o.optString("uri"))) recent.put(o);
      }
      getPreferences(0).edit().putString("recent", recent.toString()).apply();
    } catch (Exception ignored) {}
  }
  private void openEntry(Entry selected, List<Entry> all) {
    remember(selected);
    ArrayList<Entry> filtered = new ArrayList<>();
    for (Entry e : all) if (selected.picture() ? e.picture() : e.media() && !e.picture()) filtered.add(e);
    int chosen = filtered.indexOf(selected);
    if (chosen < 0) { filtered.clear(); filtered.add(selected); chosen = 0; }
    final int start = Math.max(0, chosen - 24);
    final int end = Math.min(filtered.size(), start + 60);
    ArrayList<String> uris = new ArrayList<>();
    ArrayList<String> names = new ArrayList<>();
    ArrayList<String> types = new ArrayList<>();
    for (int i = start; i < end; i++) {
      Entry e = filtered.get(i);
      uris.add(e.uri.toString());
      names.add(e.name);
      types.add(e.mime);
    }
    Intent intent = new Intent(this, selected.picture() ? PhotoActivity.class : PlayerActivity.class);
    intent.putStringArrayListExtra("uris", uris);
    intent.putStringArrayListExtra("names", names);
    intent.putStringArrayListExtra("mimes", types);
    intent.putExtra("selected_index", chosen - start);
    startActivity(intent);
  }
  private void showRecent() {
    viewingFolder = false;
    items.removeAllViews();
    hint("Recent media • Choose a video, song, photo, or folder to begin");
    try {
      JSONArray a = new JSONArray(getPreferences(0).getString("recent", "[]"));
      if (a.length() == 0) items.addView(label(
          "No media selected yet. Open the file picker above. If Google Drive is offered by your TV's file picker, you can select your own Drive files from there.", 17));
      ArrayList<Entry> entries = new ArrayList<>();
      for (int i = 0; i < a.length(); i++) {
        JSONObject o = a.optJSONObject(i);
        if (o == null) continue;
        entries.add(new Entry(Uri.parse(o.optString("uri")), o.optString("name", "Media"), o.optString("mime", "")));
      }
      for (Entry entry : entries) addEntry(entry, entries);
    } catch (Exception ex) { items.addView(label("Unable to read your recent-media list.", 17)); }
  }
  private void addEntry(Entry entry, List<Entry> all) {
    String symbol = entry.picture() ? "▧  " : entry.audio() ? "♫  " : "▶  ";
    Button b = button(symbol + entry.name);
    b.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
    b.setOnClickListener(v -> openEntry(entry, all));
    items.addView(b);
  }
  private void showFolder() {
    viewingFolder = true;
    items.removeAllViews();
    if (tree == null || documentId == null) { showRecent(); return; }
    hint("Selected folder • Videos, songs and photos");
    if (!folderStack.isEmpty()) {
      Button back = button("◀  Back to previous folder");
      back.setOnClickListener(v -> {
        documentId = folderStack.remove(folderStack.size() - 1);
        showFolder();
      });
      items.addView(back);
    }
    try {
      Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, documentId);
      String[] columns = {
        DocumentsContract.Document.COLUMN_DOCUMENT_ID,
        DocumentsContract.Document.COLUMN_DISPLAY_NAME,
        DocumentsContract.Document.COLUMN_MIME_TYPE
      };
      ArrayList<Entry> playable = new ArrayList<>();
      ArrayList<String[]> folders = new ArrayList<>();
      try (Cursor c = getContentResolver().query(children, columns, null, null, null)) {
        int count = 0;
        while (c != null && c.moveToNext() && count++ < 500) {
          String id = c.getString(0), name = c.getString(1), mime = c.getString(2);
          if (id == null || name == null) continue;
          if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
            folders.add(new String[]{id, name});
          } else {
            Entry entry = new Entry(DocumentsContract.buildDocumentUriUsingTree(tree, id), name, mime);
            if (entry.media() || entry.picture()) playable.add(entry);
          }
        }
      }
      for (String[] folder : folders) {
        Button b = button("▣  " + folder[1] + "  →");
        b.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        b.setOnClickListener(v -> {
          folderStack.add(documentId); documentId = folder[0]; showFolder();
        });
        items.addView(b);
      }
      if (!playable.isEmpty()) {
        Button playAll = button("▶  PLAY ALL MUSIC & VIDEO IN THIS FOLDER");
        playAll.setOnClickListener(v -> {
          for (Entry entry : playable) if (entry.media() && !entry.picture()) {
            openEntry(entry, playable); return;
          }
          hint("This folder has pictures but no music or videos.");
        });
        items.addView(playAll);
      }
      for (Entry entry : playable) addEntry(entry, playable);
      if (folders.isEmpty() && playable.isEmpty()) {
        items.addView(label("No supported media entries found here. Some cloud providers do not expose their folders through the Android picker.", 17));
      }
    } catch (Exception e) {
      items.addView(label("This folder cannot be browsed. Try selecting an individual file instead. (" + e.getClass().getSimpleName() + ")", 16));
    }
  }
  private void openDrive() {
    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://drive.google.com/drive/u/0/my-drive"))); }
    catch (Exception ignored) { hint("No suitable TV browser was found."); }
  }
  @Override public void onBackPressed() {
    if (viewingFolder && !folderStack.isEmpty()) {
      documentId = folderStack.remove(folderStack.size() - 1);
      showFolder();
    } else super.onBackPressed();
  }
}
