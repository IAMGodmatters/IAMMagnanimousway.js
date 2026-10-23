package com.magnanimous.drivetv;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.MediaController;
import android.widget.TextView;
import android.widget.VideoView;
import android.widget.Toast;

public class PlayerActivity extends Activity {
  private VideoView player;private String key;
  @Override public void onCreate(Bundle state){super.onCreate(state);
    String u=getIntent().getStringExtra("video_uri");if(u==null){finish();return;}
    key="resume_"+Integer.toHexString(u.hashCode());
    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    LinearLayout root=new LinearLayout(this);root.setOrientation(1);root.setBackgroundColor(0xff000000);
    player=new VideoView(this);root.addView(player,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
    MediaController control=new MediaController(this);control.setAnchorView(player);player.setMediaController(control);
    player.setOnErrorListener((mp,what,extra)->{Toast.makeText(this,"Unsupported video format or storage provider stream.",Toast.LENGTH_LONG).show();return true;});
    player.setOnPreparedListener(mp->{int resume=getPreferences(0).getInt(key,0);if(resume>0)player.seekTo(resume);player.start();control.show(4500);});
    player.setOnCompletionListener(mp->getPreferences(0).edit().remove(key).apply());
    player.setVideoURI(Uri.parse(u));
  }
  @Override protected void onPause(){if(player!=null&&player.getCurrentPosition()>0)getPreferences(0).edit().putInt(key,player.getCurrentPosition()).apply();super.onPause();}
  @Override protected void onDestroy(){if(player!=null)player.stopPlayback();super.onDestroy();}
}
