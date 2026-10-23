package com.magnanimous.drivetv;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Locale;

@UnstableApi
public class PlayerActivity extends Activity {
  private static final int PICK_SUBTITLE = 204;
  private ExoPlayer player;
  private PlayerView playerView;
  private TextView title;
  private TextView info;
  private TextView audioArt;
  private Button pause;
  private Button repeat;
  private Button shuffle;
  private final ArrayList<MediaItem> playlist = new ArrayList<>();
  private ArrayList<String> uris;
  private ArrayList<String> names;
  private ArrayList<String> mimes;
  private String lastUri;
  private boolean finished;

  private int color(String hex) { return android.graphics.Color.parseColor(hex); }
  private TextView text(String content, int size) {
    TextView view = new TextView(this);
    view.setText(content); view.setTextSize(size);
    view.setTextColor(color("#EAF3FF")); view.setPadding(12, 4, 12, 4);
    return view;
  }
  private Button control(String caption, LinearLayout bar, View.OnClickListener click) {
    Button button = new Button(this);
    button.setText(caption); button.setTextSize(14); button.setAllCaps(false);
    button.setFocusable(true); button.setOnClickListener(click);
    bar.addView(button, new LinearLayout.LayoutParams(0, -2, 1));
    return button;
  }
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    uris = getIntent().getStringArrayListExtra("uris");
    names = getIntent().getStringArrayListExtra("names");
    mimes = getIntent().getStringArrayListExtra("mimes");
    if (uris == null || uris.isEmpty()) { finish(); return; }
    if (names == null || names.size() != uris.size()) names = new ArrayList<>(uris);
    if (mimes == null || mimes.size() != uris.size()) {
      mimes = new ArrayList<>();
      for (int i = 0; i < uris.size(); i++) mimes.add("");
    }
    getWindow().getDecorView().setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    buildLayout();
    player = new ExoPlayer.Builder(this).build();
    playerView.setPlayer(player);
    playerView.setUseController(true);
    playerView.setControllerShowTimeoutMs(6000);
    playerView.setShowSubtitleButton(true);
    playerView.setShowNextButton(true);
    playerView.setShowPreviousButton(true);
    playerView.setShowFastForwardButton(true);
    playerView.setShowRewindButton(true);
    for (int i = 0; i < uris.size(); i++) playlist.add(item(i, null));
    int selected = Math.max(0, Math.min(getIntent().getIntExtra("selected_index", 0), uris.size() - 1));
    lastUri = uris.get(selected);
    long resume = Math.max(0, getPreferences(0).getLong(key(lastUri), 0));
    player.setMediaItems(playlist, selected, resume);
    player.setRepeatMode(Player.REPEAT_MODE_OFF);
    player.addListener(new Player.Listener() {
      @Override public void onMediaItemTransition(MediaItem item, int reason) {
        if (reason == Player.MEDIA_ITEM_TRANSITION_REASON_AUTO && lastUri != null)
          getPreferences(0).edit().remove(key(lastUri)).apply();
        showCurrent();
      }
      @Override public void onPlaybackStateChanged(int state) {
        if (state == Player.STATE_BUFFERING) info.setText("Loading media…");
        else if (state == Player.STATE_READY) info.setText("Playing • Remote OK: controls • ◀/▶: seek");
        else if (state == Player.STATE_ENDED) {
          info.setText("Playback complete");
          finished = true;
          savePosition();
        }
      }
      @Override public void onIsPlayingChanged(boolean playing) {
        pause.setText(playing ? "Ⅱ Pause" : "▶ Play");
      }
      @Override public void onPlayerError(PlaybackException error) {
        info.setText("Cannot play this file or stream. Try MP4 (H.264/AAC), MP3, or open with another player. " +
            error.getErrorCodeName());
        pause.setText("▶ Retry");
      }
    });
    showCurrent();
    player.prepare();
    player.play();
  }
  private MediaItem item(int index, MediaItem.SubtitleConfiguration subtitle) {
    MediaItem.Builder builder = new MediaItem.Builder()
        .setUri(Uri.parse(uris.get(index)))
        .setMediaMetadata(new MediaMetadata.Builder().setTitle(names.get(index)).build());
    if (subtitle != null) builder.setSubtitleConfigurations(Collections.singletonList(subtitle));
    return builder.build();
  }
  private void buildLayout() {
    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL); root.setPadding(8, 6, 8, 8);
    root.setBackgroundColor(color("#061324"));
    title = text("MAGNANIMOUS MEDIA PLAYER", 20);
    title.setSingleLine(true); title.setEllipsize(android.text.TextUtils.TruncateAt.MARQUEE);
    root.addView(title);
    FrameLayout display = new FrameLayout(this);
    playerView = new PlayerView(this);
    playerView.setKeepScreenOn(true);
    display.addView(playerView, new FrameLayout.LayoutParams(-1, -1));
    audioArt = text("♫\n\nMAGNANIMOUS MUSIC", 36);
    audioArt.setGravity(Gravity.CENTER); audioArt.setVisibility(View.GONE);
    display.addView(audioArt, new FrameLayout.LayoutParams(-1, -1));
    root.addView(display, new LinearLayout.LayoutParams(-1, 0, 1));
    info = text("Opening file…", 14);
    info.setSingleLine(true);
    root.addView(info);
    LinearLayout bar = new LinearLayout(this);
    bar.setOrientation(LinearLayout.HORIZONTAL);
    control("|◀ Prev", bar, v -> { savePosition(); if (player.hasPreviousMediaItem()) player.seekToPreviousMediaItem(); else player.seekTo(0); });
    control("↶ 10s", bar, v -> seek(-10000));
    pause = control("Ⅱ Pause", bar, v -> {
      if (player.getPlaybackState() == Player.STATE_IDLE && player.getPlayerError() != null) {
        player.prepare(); player.play(); return;
      }
      if (player.isPlaying()) player.pause(); else player.play();
    });
    control("10s ↷", bar, v -> seek(10000));
    control("Next ▶|", bar, v -> { savePosition(); if (player.hasNextMediaItem()) player.seekToNextMediaItem(); });
    control("Subtitles", bar, v -> chooseSubtitle());
    control("External", bar, v -> openExternal());
    root.addView(bar);
    LinearLayout options = new LinearLayout(this); options.setOrientation(LinearLayout.HORIZONTAL);
    repeat = control("Repeat: off", options, v -> {
      boolean on = player.getRepeatMode() != Player.REPEAT_MODE_ALL;
      player.setRepeatMode(on ? Player.REPEAT_MODE_ALL : Player.REPEAT_MODE_OFF);
      repeat.setText(on ? "Repeat: all" : "Repeat: off");
    });
    shuffle = control("Shuffle: off", options, v -> {
      boolean on = !player.getShuffleModeEnabled();
      player.setShuffleModeEnabled(on);
      shuffle.setText(on ? "Shuffle: on" : "Shuffle: off");
    });
    control("Back to library", options, v -> finish());
    root.addView(options);
    setContentView(root);
  }
  private String key(String uri) { return "resume_" + Integer.toHexString(uri.hashCode()); }
  private void savePosition() {
    if (player == null || lastUri == null) return;
    if (finished) { getPreferences(0).edit().remove(key(lastUri)).apply(); return; }
    long duration = player.getDuration();
    long pos = Math.max(0, player.getCurrentPosition());
    if (duration > 0 && pos >= duration - 4500) getPreferences(0).edit().remove(key(lastUri)).apply();
    else if (pos > 4000) getPreferences(0).edit().putLong(key(lastUri), pos).apply();
  }
  private void showCurrent() {
    if (player == null) return;
    int index = player.getCurrentMediaItemIndex();
    if (index < 0 || index >= names.size()) return;
    lastUri = uris.get(index);
    finished = false;
    title.setText((index + 1) + "/" + uris.size() + "   " + names.get(index));
    String lower = names.get(index).toLowerCase(Locale.ROOT);
    boolean music = mimes.get(index).startsWith("audio/") ||
        lower.matches(".*\\.(mp3|m4a|aac|flac|wav|ogg|opus|wma|aiff)$");
    audioArt.setVisibility(music ? View.VISIBLE : View.GONE);
    if (music) info.setText("Music mode • playlists, repeat, shuffle and resume");
  }
  private void seek(long amountMs) {
    if (player == null) return;
    long newPosition = Math.max(0, player.getCurrentPosition() + amountMs);
    long duration = player.getDuration();
    if (duration != C.TIME_UNSET && duration > 0) newPosition = Math.min(duration, newPosition);
    player.seekTo(newPosition);
  }
  private void chooseSubtitle() {
    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("*/*");
    intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/x-subrip", "text/vtt", "text/plain"});
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    try { startActivityForResult(intent, PICK_SUBTITLE); }
    catch (ActivityNotFoundException e) { info.setText("This TV has no file picker for external subtitles."); }
  }
  @Override protected void onActivityResult(int request, int result, Intent data) {
    super.onActivityResult(request, result, data);
    if (request != PICK_SUBTITLE || result != RESULT_OK || data == null || data.getData() == null || player == null) return;
    Uri uri = data.getData();
    try { getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); }
    catch (SecurityException | IllegalArgumentException ignored) {}
    String text = uri.getLastPathSegment() == null ? "" : uri.getLastPathSegment().toLowerCase(Locale.ROOT);
    String mime = text.endsWith(".vtt") ? MimeTypes.TEXT_VTT : MimeTypes.APPLICATION_SUBRIP;
    MediaItem.SubtitleConfiguration subs = new MediaItem.SubtitleConfiguration.Builder(uri)
        .setMimeType(mime).setLanguage("und")
        .setSelectionFlags(C.SELECTION_FLAG_DEFAULT).build();
    int index = player.getCurrentMediaItemIndex();
    if (index < 0 || index >= playlist.size()) return;
    savePosition();
    long position = Math.max(0, player.getCurrentPosition());
    boolean wasPlaying = player.getPlayWhenReady();
    playlist.set(index, item(index, subs));
    player.setMediaItems(playlist, index, position);
    player.prepare();
    player.setPlayWhenReady(wasPlaying);
    info.setText("Subtitle added. Choose CC in playback controls to change tracks.");
  }
  private void openExternal() {
    if (player == null || player.getCurrentMediaItemIndex() < 0) return;
    int index = player.getCurrentMediaItemIndex();
    Uri source = Uri.parse(uris.get(index));
    String mime = mimes.get(index).startsWith("audio/") ? "audio/*" : "video/*";
    Intent intent = new Intent(Intent.ACTION_VIEW);
    intent.setDataAndType(source, mime);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    try { startActivity(Intent.createChooser(intent, "Choose another installed media player")); }
    catch (ActivityNotFoundException e) { info.setText("No other media player installed."); }
  }
  @Override protected void onPause() { savePosition(); super.onPause(); }
  @Override protected void onDestroy() {
    if (player != null) { player.release(); player = null; }
    super.onDestroy();
  }
}
