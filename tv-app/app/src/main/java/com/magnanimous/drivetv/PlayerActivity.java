package com.magnanimous.drivetv;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

import java.util.ArrayList;
import java.util.Locale;

@UnstableApi
public class PlayerActivity extends Activity {
    public static final String EXTRA_URIS = "media_uris";
    public static final String EXTRA_NAMES = "media_names";
    public static final String EXTRA_INDEX = "media_index";
    private static final int PICK_SUBTITLE = 501;

    private ExoPlayer player;
    private PlayerView playerView;
    private TextView title, queueStatus, audioArt, helpText;
    private Button previous, playPause, next, repeat, speed, subtitles, queue;
    private LinearLayout queuePanel, controls;
    private final ArrayList<String> uris = new ArrayList<>();
    private final ArrayList<String> names = new ArrayList<>();
    private boolean queueVisible = false;
    private boolean subtitlesEnabled = true;
    private final float[] speeds = {1f, 1.25f, 1.5f, 2f, 0.75f};
    private int speedIndex = 0;
    private int repeatMode = Player.REPEAT_MODE_OFF;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable periodicSave = new Runnable() {
        @Override public void run() {
            savePosition();
            updateLabels();
            handler.postDelayed(this, 10000);
        }
    };

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        Intent args = getIntent();
        ArrayList<String> sources = args.getStringArrayListExtra(EXTRA_URIS);
        ArrayList<String> titles = args.getStringArrayListExtra(EXTRA_NAMES);
        if (sources == null || sources.isEmpty()) {finish();return;}
        for (int i=0; i<sources.size(); i++) {
            String uri=sources.get(i);
            if (uri==null || uri.isEmpty()) continue;
            Uri parsed=Uri.parse(uri);
            // Never launch arbitrary internet URLs from external intents.
            String scheme=parsed.getScheme();
            if (!"content".equalsIgnoreCase(scheme) && !"file".equalsIgnoreCase(scheme)) continue;
            uris.add(uri);
            names.add(titles!=null && i<titles.size() && titles.get(i)!=null ? titles.get(i) : "Media");
        }
        if (uris.isEmpty()) {finish();return;}
        makeLayout();
        createPlayer(Math.max(0,Math.min(args.getIntExtra(EXTRA_INDEX,0),uris.size()-1)));
    }

    private Button button(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(15);
        b.setFocusable(true);
        b.setPadding(4,6,4,6);
        return b;
    }
    private TextView label(String content, int size) {
        TextView v = new TextView(this);
        v.setText(content);
        v.setTextSize(size);
        v.setTextColor(0xffeaf3ff);
        v.setGravity(Gravity.CENTER_VERTICAL);
        v.setPadding(8,4,8,4);
        return v;
    }

    private void makeLayout() {
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xff06111e);
        title=label("MAGNANIMOUS PLAYER",19);
        title.setSingleLine(true);
        title.setEllipsize(android.text.TextUtils.TruncateAt.END);
        root.addView(title,new LinearLayout.LayoutParams(-1,42));

        FrameLayout screen=new FrameLayout(this);
        screen.setBackgroundColor(0xff000000);
        playerView=new PlayerView(this);
        playerView.setUseController(true);
        playerView.setControllerShowTimeoutMs(5000);
        playerView.setControllerAutoShow(true);
        playerView.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING);
        screen.addView(playerView,new FrameLayout.LayoutParams(-1,-1));
        audioArt=label("♫\n\nMAGNANIMOUS MUSIC",24);
        audioArt.setGravity(Gravity.CENTER);
        audioArt.setBackgroundColor(0xff0f273c);
        audioArt.setVisibility(View.GONE);
        FrameLayout.LayoutParams artParams=new FrameLayout.LayoutParams(-1,-1);
        screen.addView(audioArt,artParams);
        root.addView(screen,new LinearLayout.LayoutParams(-1,0,1));

        controls=new LinearLayout(this);
        controls.setOrientation(LinearLayout.HORIZONTAL);
        previous=button("⏮ Previous");
        previous.setOnClickListener(v->skipPrevious());
        controls.addView(previous,new LinearLayout.LayoutParams(0,-2,1));
        Button rewind=button("−10s");
        rewind.setOnClickListener(v->seek(-10000));
        controls.addView(rewind,new LinearLayout.LayoutParams(0,-2,1));
        playPause=button("Pause");
        playPause.setOnClickListener(v->toggle());
        controls.addView(playPause,new LinearLayout.LayoutParams(0,-2,1));
        Button forward=button("+30s");
        forward.setOnClickListener(v->seek(30000));
        controls.addView(forward,new LinearLayout.LayoutParams(0,-2,1));
        next=button("Next ⏭");
        next.setOnClickListener(v->skipNext());
        controls.addView(next,new LinearLayout.LayoutParams(0,-2,1));
        root.addView(controls);

        LinearLayout options=new LinearLayout(this);
        options.setOrientation(LinearLayout.HORIZONTAL);
        repeat=button("Repeat off");
        repeat.setOnClickListener(v->cycleRepeat());
        options.addView(repeat,new LinearLayout.LayoutParams(0,-2,1));
        speed=button("Speed 1.0×");
        speed.setOnClickListener(v->cycleSpeed());
        options.addView(speed,new LinearLayout.LayoutParams(0,-2,1));
        subtitles=button("Add subtitles");
        subtitles.setOnClickListener(v->pickSubtitle());
        options.addView(subtitles,new LinearLayout.LayoutParams(0,-2,1));
        queue=button("Up next");
        queue.setOnClickListener(v->toggleQueue());
        options.addView(queue,new LinearLayout.LayoutParams(0,-2,1));
        root.addView(options);

        queueStatus=label("",13);
        root.addView(queueStatus);
        helpText=label("TV remote: OK to pause / resume • LEFT −10 seconds • RIGHT +30 seconds • BACK to library",13);
        root.addView(helpText);
        queuePanel=new LinearLayout(this);
        queuePanel.setOrientation(LinearLayout.VERTICAL);
        queuePanel.setBackgroundColor(0xff10273c);
        queuePanel.setVisibility(View.GONE);
        root.addView(queuePanel);
        setContentView(root);
        playPause.requestFocus();
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    private void createPlayer(int start) {
        player=new ExoPlayer.Builder(this).build();
        playerView.setPlayer(player);
        for (int i=0;i<uris.size();i++) {
            Uri uri=Uri.parse(uris.get(i));
            MediaItem.Builder item=new MediaItem.Builder().setUri(uri).setMediaId(uris.get(i));
            // Local content URI mime inference normally works, but explicit audio/video names aid extraction.
            String n=names.get(i).toLowerCase(Locale.ROOT);
            if (n.endsWith(".m3u8")) item.setMimeType(MimeTypes.APPLICATION_M3U8);
            player.addMediaItem(item.build());
        }
        player.setRepeatMode(repeatMode);
        player.addListener(new Player.Listener() {
            @Override public void onMediaItemTransition(MediaItem media, int reason) {
                updateLabels();
                if (player != null && media != null) {
                    String key=key(media.mediaId);
                    long resume=getPreferences(0).getLong(key,0L);
                    if (resume>0 && reason!=Player.MEDIA_ITEM_TRANSITION_REASON_REPEAT) {
                        player.seekTo(resume);
                    }
                }
            }
            @Override public void onIsPlayingChanged(boolean isPlaying) {updateLabels();}
            @Override public void onPlayerError(PlaybackException error) {
                String message="This format, codec or storage-provider stream couldn't play on this TV.";
                helpText.setText(message + " Select another file or try an MP4/H.264 or MP3 format.");
                Toast.makeText(PlayerActivity.this,message,Toast.LENGTH_LONG).show();
            }
        });
        player.seekToDefaultPosition(start);
        player.prepare();
        player.play();
        handler.postDelayed(periodicSave,10000);
        updateLabels();
    }

    private String key(String uri) {return "resume_"+Integer.toHexString(uri.hashCode());}
    private void savePosition() {
        if (player==null||player.getMediaItemCount()==0) return;
        int index=player.getCurrentMediaItemIndex();
        if (index<0||index>=uris.size()) return;
        long position=player.getCurrentPosition();
        if (position<=0) return;
        long duration=player.getDuration();
        if (duration>0 && position>duration-10000)
            getPreferences(0).edit().remove(key(uris.get(index))).apply();
        else getPreferences(0).edit().putLong(key(uris.get(index)),position).apply();
    }
    private void updateLabels() {
        if (player==null)return;
        int pos=player.getCurrentMediaItemIndex();
        if(pos<0||pos>=names.size())return;
        title.setText(names.get(pos));
        queueStatus.setText((pos+1)+" of "+names.size()+"  •  "+ (player.isPlaying()?"Playing":"Paused")+
            "  •  "+human(player.getCurrentPosition())+" / "+human(player.getDuration()));
        playPause.setText(player.isPlaying()?"Pause":"Play");
        audioArt.setVisibility(isAudio(names.get(pos)) ? View.VISIBLE : View.GONE);
        updateQueueDisplay();
    }
    private boolean isAudio(String name) {
        return name.toLowerCase(Locale.ROOT).matches(".*\\.(mp3|m4a|aac|wav|flac|ogg|opus|wma|aiff|amr)$");
    }
    private String human(long ms) {
        if (ms<0)return "--:--";
        long sec=ms/1000;
        return String.format(Locale.US,"%02d:%02d:%02d",sec/3600,(sec/60)%60,sec%60);
    }
    private void toggle() {if(player==null)return;if(player.isPlaying())player.pause();else player.play();updateLabels();}
    private void seek(long delta) {
        if(player==null)return;
        long p=Math.max(0,player.getCurrentPosition()+delta);
        if(player.getDuration()>0)p=Math.min(p,player.getDuration());
        player.seekTo(p);
        updateLabels();
    }
    private void skipPrevious() {
        if(player==null)return;
        savePosition();
        if (player.hasPreviousMediaItem()) player.seekToPreviousMediaItem();
        else player.seekTo(0);
        player.play();
        updateLabels();
    }
    private void skipNext() {
        if(player==null)return;
        savePosition();
        if(player.hasNextMediaItem())player.seekToNextMediaItem();
        else if(player.getRepeatMode()==Player.REPEAT_MODE_ALL)player.seekToDefaultPosition(0);
        else Toast.makeText(this,"End of playlist",Toast.LENGTH_SHORT).show();
        player.play();
        updateLabels();
    }
    private void cycleRepeat() {
        repeatMode=(repeatMode==Player.REPEAT_MODE_OFF)?Player.REPEAT_MODE_ALL:
            (repeatMode==Player.REPEAT_MODE_ALL)?Player.REPEAT_MODE_ONE:Player.REPEAT_MODE_OFF;
        player.setRepeatMode(repeatMode);
        repeat.setText(repeatMode==Player.REPEAT_MODE_ALL?"Repeat all":repeatMode==Player.REPEAT_MODE_ONE?"Repeat one":"Repeat off");
    }
    private void cycleSpeed() {
        speedIndex=(speedIndex+1)%speeds.length;
        player.setPlaybackSpeed(speeds[speedIndex]);
        speed.setText("Speed "+speeds[speedIndex]+"×");
    }
    private void toggleQueue() {
        queueVisible=!queueVisible;
        queuePanel.setVisibility(queueVisible ? View.VISIBLE : View.GONE);
        updateQueueDisplay();
    }
    private void updateQueueDisplay() {
        if(!queueVisible||player==null)return;
        queuePanel.removeAllViews();
        int current=player.getCurrentMediaItemIndex();
        // Compact actionable TV playlist: current track + next 4 files.
        int count=Math.min(5,names.size());
        for(int j=0;j<count;j++){
            int i=(current+j)%names.size();
            Button b=button((i==current?"▶  ":"   ")+names.get(i));
            b.setGravity(Gravity.START);
            b.setOnClickListener(v-> {
                savePosition();player.seekToDefaultPosition(i);player.play();
                queueVisible=false;queuePanel.setVisibility(View.GONE);updateLabels();
            });
            queuePanel.addView(b);
        }
    }
    private void pickSubtitle() {
        if(player==null)return;
        Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/x-subrip","text/vtt","text/plain","application/octet-stream"});
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try {startActivityForResult(i,PICK_SUBTITLE);}
        catch(Exception e){Toast.makeText(this,"Subtitle picker unavailable",Toast.LENGTH_SHORT).show();}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request!=PICK_SUBTITLE || result!=RESULT_OK || data==null || data.getData()==null || player==null)return;
        Uri chosen=data.getData();
        try{getContentResolver().takePersistableUriPermission(chosen,Intent.FLAG_GRANT_READ_URI_PERMISSION);}
        catch(Exception ignored){}
        int current=player.getCurrentMediaItemIndex();
        long at=player.getCurrentPosition();
        String extension=chosen.getLastPathSegment()==null?"":chosen.getLastPathSegment().toLowerCase(Locale.ROOT);
        String mime=extension.endsWith(".vtt")?MimeTypes.TEXT_VTT:MimeTypes.APPLICATION_SUBRIP;
        MediaItem.SubtitleConfiguration sub=new MediaItem.SubtitleConfiguration.Builder(chosen)
            .setMimeType(mime).setLanguage("en").setSelectionFlags(C.SELECTION_FLAG_DEFAULT).build();
        MediaItem replacement=new MediaItem.Builder().setUri(Uri.parse(uris.get(current)))
            .setMediaId(uris.get(current)).setSubtitleConfigurations(java.util.Collections.singletonList(sub)).build();
        player.replaceMediaItem(current,replacement);
        player.seekTo(current,at);
        player.prepare();
        player.play();
        Toast.makeText(this,"Subtitles attached to current video",Toast.LENGTH_SHORT).show();
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if(event.getAction()==KeyEvent.ACTION_DOWN && player!=null) {
            if(event.getKeyCode()==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE){toggle();return true;}
            if(event.getKeyCode()==KeyEvent.KEYCODE_MEDIA_NEXT){skipNext();return true;}
            if(event.getKeyCode()==KeyEvent.KEYCODE_MEDIA_PREVIOUS){skipPrevious();return true;}
        }
        return super.dispatchKeyEvent(event);
    }
    @Override protected void onPause() {
        savePosition();
        if(player!=null)player.pause();
        super.onPause();
    }
    @Override protected void onResume(){super.onResume();}
    @Override protected void onDestroy() {
        handler.removeCallbacks(periodicSave);
        savePosition();
        if(player!=null){playerView.setPlayer(null);player.release();player=null;}
        super.onDestroy();
    }
}
