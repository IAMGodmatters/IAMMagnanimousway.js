package com.magnanimous.drivetv;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
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
import android.widget.MediaController;
import android.widget.TextView;
import android.widget.VideoView;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Locale;
import java.util.Random;

public final class PlayerActivity extends Activity {
  private static final int SELECT_SUBTITLE=204;
  private final ArrayList<String> uris=new ArrayList<>();
  private final ArrayList<String> names=new ArrayList<>();
  private final ArrayList<String> mimes=new ArrayList<>();
  private final ArrayList<Caption> captions=new ArrayList<>();
  private final Handler handler=new Handler(Looper.getMainLooper());
  private final Random rng=new Random();
  private VideoView video;
  private MediaController controller;
  private TextView title,message,music,subtitle;
  private Button pauseButton,repeatButton,shuffleButton;
  private int index,repeatMode=0;
  private boolean shuffle=false,ending=false,closed=false;
  private String activeUri;
  private long saved;
  private static final class Caption {
    final long a,b;final String text;
    Caption(long start,long end,String value){a=start;b=end;text=value;}
  }
  private final Runnable tick=new Runnable(){
    @Override public void run(){
      if(closed||video==null)return;
      try{
        int position=video.getCurrentPosition();
        if(position>5000 && activeUri!=null && !ending)getPreferences(0).edit().putLong(key(activeUri),position).apply();
        showSubtitle(position);
      }catch(Exception ignored){}
      handler.postDelayed(this,1500);
    }
  };
  @Override public void onCreate(Bundle savedState){
    super.onCreate(savedState);
    ArrayList<String> sources=getIntent().getStringArrayListExtra("uris");
    ArrayList<String> titles=getIntent().getStringArrayListExtra("names");
    ArrayList<String> types=getIntent().getStringArrayListExtra("mimes");
    if(sources==null||sources.isEmpty()){finish();return;}
    for(int i=0;i<sources.size()&&uris.size()<60;i++){
      String u=sources.get(i);
      if(u==null)continue;
      Uri parsed=Uri.parse(u);
      String scheme=parsed.getScheme();
      if(!"content".equalsIgnoreCase(scheme)&&!"file".equalsIgnoreCase(scheme))continue;
      uris.add(u);
      String n=titles!=null&&titles.size()>i?titles.get(i):null;
      names.add(n==null?"Media":n);
      String m=types!=null&&types.size()>i?types.get(i):null;
      mimes.add(m==null?"":m);
    }
    if(uris.isEmpty()){finish();return;}
    index=Math.max(0,Math.min(uris.size()-1,getIntent().getIntExtra("selected_index",0)));
    makeLayout();
    open(index);
    handler.postDelayed(tick,1500);
  }
  private TextView label(String s,int size){
    TextView t=new TextView(this);
    t.setText(s);t.setTextSize(size);t.setTextColor(Color.WHITE);t.setPadding(12,8,12,8);return t;
  }
  private Button button(LinearLayout row,String name,View.OnClickListener fn){
    Button b=new Button(this);
    b.setText(name);b.setAllCaps(false);b.setTextSize(14);b.setFocusable(true);b.setOnClickListener(fn);
    row.addView(b,new LinearLayout.LayoutParams(0,-2,1));return b;
  }
  private void makeLayout(){
    LinearLayout root=new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xff071525);root.setPadding(10,6,10,6);
    title=label("MAGNANIMOUS MEDIA PLAYER",20);
    title.setSingleLine(true);root.addView(title);
    FrameLayout display=new FrameLayout(this);display.setBackgroundColor(Color.BLACK);
    video=new VideoView(this);display.addView(video,new FrameLayout.LayoutParams(-1,-1));
    music=label("♫\n\nMAGNANIMOUS MUSIC",32);music.setGravity(Gravity.CENTER);music.setBackgroundColor(0xff123047);
    music.setVisibility(View.GONE);display.addView(music,new FrameLayout.LayoutParams(-1,-1));
    subtitle=label("",19);subtitle.setGravity(Gravity.CENTER);subtitle.setBackgroundColor(0xbb000000);subtitle.setVisibility(View.GONE);
    FrameLayout.LayoutParams sub=new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM);
    sub.setMargins(20,0,20,18);display.addView(subtitle,sub);
    root.addView(display,new LinearLayout.LayoutParams(-1,0,1));
    message=label("Loading…",14);root.addView(message);
    LinearLayout controls=new LinearLayout(this);controls.setOrientation(LinearLayout.HORIZONTAL);
    button(controls,"Previous",v->previous());
    button(controls,"-10s",v->seek(-10000));
    pauseButton=button(controls,"Play/Pause",v->toggle());
    button(controls,"+10s",v->seek(10000));
    button(controls,"Next",v->next(false));
    button(controls,"Subtitles",v->chooseSubtitles());
    root.addView(controls);
    LinearLayout options=new LinearLayout(this);options.setOrientation(LinearLayout.HORIZONTAL);
    repeatButton=button(options,"Repeat off",v->{repeatMode=(repeatMode+1)%3;repeatButton.setText(repeatMode==0?"Repeat off":repeatMode==1?"Repeat all":"Repeat one");});
    shuffleButton=button(options,"Shuffle off",v->{shuffle=!shuffle;shuffleButton.setText(shuffle?"Shuffle on":"Shuffle off");});
    button(options,"Other player",v->openOther());
    button(options,"Back to library",v->finish());
    root.addView(options);setContentView(root);
    controller=new MediaController(this);controller.setAnchorView(video);video.setMediaController(controller);
    video.setOnPreparedListener(mp->{
      if(saved>0 && saved<Integer.MAX_VALUE)video.seekTo((int)saved);
      saved=0;video.start();pauseButton.setText("Pause");
      message.setText("Playing • Use the TV remote to pause and seek.");
      controller.show(3500);
    });
    video.setOnCompletionListener(mp->{
      ending=true;
      if(activeUri!=null)getPreferences(0).edit().remove(key(activeUri)).apply();
      next(true);
    });
    video.setOnErrorListener((mp,what,extra)->{
      message.setText("Cannot play this file on this TV. Try MP4 H.264/AAC or MP3, or choose Other player.");
      pauseButton.setText("Retry");return true;
    });
    pauseButton.requestFocus();
  }
  private String key(String uri){return "resume_"+Integer.toHexString(uri.hashCode());}
  private boolean audio(int at){
    String n=names.get(at).toLowerCase(Locale.ROOT);
    return mimes.get(at).startsWith("audio/")||n.matches(".*\\.(mp3|m4a|aac|wav|flac|ogg|opus|wma|amr|aiff)$");
  }
  private void savePosition(){
    if(video==null||activeUri==null||ending)return;
    try{int p=video.getCurrentPosition();if(p>5000)getPreferences(0).edit().putLong(key(activeUri),p).apply();}
    catch(Exception ignored){}
  }
  private void open(int pos){
    if(pos<0||pos>=uris.size())return;
    savePosition();index=pos;activeUri=uris.get(pos);ending=false;
    captions.clear();subtitle.setVisibility(View.GONE);
    title.setText((index+1)+"/"+uris.size()+"   "+names.get(index));
    message.setText("Opening "+names.get(index)+"…");
    music.setVisibility(audio(index)?View.VISIBLE:View.GONE);
    saved=getPreferences(0).getLong(key(activeUri),0);
    try{video.stopPlayback();video.setVideoURI(Uri.parse(activeUri));video.requestFocus();video.start();}
    catch(Exception e){message.setText("Cannot open file: "+e.getClass().getSimpleName());}
  }
  private void next(boolean auto){
    if(repeatMode==2 && auto){open(index);return;}
    if(shuffle && uris.size()>1){
      int i=index;while(i==index)i=rng.nextInt(uris.size());open(i);return;
    }
    if(index<uris.size()-1){open(index+1);return;}
    if(repeatMode==1||!auto)open(0);else{message.setText("End of playlist");pauseButton.setText("Play");}
  }
  private void previous(){if(index>0)open(index-1);else seek(-9999999);}
  private void toggle(){if(video==null)return;if(video.isPlaying()){video.pause();pauseButton.setText("Play");}
    else{video.start();pauseButton.setText("Pause");}}
  private void seek(int ms){try{int x=video.getCurrentPosition()+ms,d=video.getDuration();
    if(d>0)x=Math.min(x,d);video.seekTo(Math.max(0,x));}catch(Exception ignored){}}
  private void openOther(){try{Intent intent=new Intent(Intent.ACTION_VIEW);intent.setDataAndType(Uri.parse(activeUri),audio(index)?"audio/*":"video/*");
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(Intent.createChooser(intent,"Choose another installed player"));}
    catch(ActivityNotFoundException e){message.setText("No other player is installed.");}}
  private void chooseSubtitles(){
    Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);
    i.setType("*/*");i.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"text/plain","application/x-subrip","text/vtt"});
    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    try{startActivityForResult(i,SELECT_SUBTITLE);}
    catch(ActivityNotFoundException e){message.setText("Subtitle picker unavailable on this TV.");}
  }
  @Override protected void onActivityResult(int request,int result,Intent data){
    super.onActivityResult(request,result,data);
    if(request!=SELECT_SUBTITLE||result!=RESULT_OK||data==null||data.getData()==null)return;
    final Uri uri=data.getData();
    try{getContentResolver().takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(Exception ignored){}
    new Thread(()->{
      ArrayList<Caption> list=new ArrayList<>();
      try(InputStream stream=getContentResolver().openInputStream(uri);
          BufferedReader reader=new BufferedReader(new InputStreamReader(stream,"UTF-8"))){
        ArrayList<String> block=new ArrayList<>();String line;int counter=0;
        while((line=reader.readLine())!=null&&counter++<10000){
          if(line.trim().isEmpty()){parseCaption(block,list);block.clear();}
          else block.add(line);
        }
        parseCaption(block,list);
      }catch(Exception ignored){}
      runOnUiThread(()->{if(!closed){captions.clear();captions.addAll(list);
        message.setText(list.isEmpty()?"No readable SRT subtitles found.":"Loaded "+list.size()+" subtitle lines.");}});
    }).start();
  }
  private static long parseTime(String s){
    String[] chunks=s.trim().replace(',','.').split("[:.]");
    if(chunks.length!=4)return -1;
    try{return (Long.parseLong(chunks[0])*3600+Long.parseLong(chunks[1])*60+Long.parseLong(chunks[2]))*1000+Long.parseLong(chunks[3]);}
    catch(Exception e){return -1;}
  }
  private static void parseCaption(ArrayList<String> block,ArrayList<Caption> parsed){
    if(block.size()<2)return;
    int found=-1;
    for(int i=0;i<Math.min(2,block.size());i++)if(block.get(i).contains("-->")){found=i;break;}
    if(found<0)return;
    String[] timestamps=block.get(found).split("-->");
    if(timestamps.length!=2)return;
    long a=parseTime(timestamps[0]),b=parseTime(timestamps[1]);
    if(a<0||b<a)return;
    StringBuilder sb=new StringBuilder();
    for(int i=found+1;i<block.size();i++)sb.append(block.get(i)).append('\n');
    parsed.add(new Caption(a,b,sb.toString().trim()));
  }
  private void showSubtitle(long position){
    if(captions.isEmpty()){subtitle.setVisibility(View.GONE);return;}
    for(Caption c:captions)if(position>=c.a && position<=c.b){
      subtitle.setText(c.text);subtitle.setVisibility(View.VISIBLE);return;}
    subtitle.setVisibility(View.GONE);
  }
  @Override public boolean dispatchKeyEvent(KeyEvent event){
    if(event.getAction()==KeyEvent.ACTION_DOWN&&video!=null){
      if(event.getKeyCode()==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE){toggle();return true;}
      if(event.getKeyCode()==KeyEvent.KEYCODE_MEDIA_NEXT){next(false);return true;}
      if(event.getKeyCode()==KeyEvent.KEYCODE_MEDIA_PREVIOUS){previous();return true;}
    }
    return super.dispatchKeyEvent(event);
  }
  @Override protected void onPause(){savePosition();if(video!=null)video.pause();super.onPause();}
  @Override protected void onDestroy(){closed=true;handler.removeCallbacks(tick);if(video!=null)video.stopPlayback();super.onDestroy();}
}
