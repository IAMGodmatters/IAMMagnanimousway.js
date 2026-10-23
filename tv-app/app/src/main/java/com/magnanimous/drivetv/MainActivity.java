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
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends Activity {
  private static final int PICK_VIDEO=101, PICK_FOLDER=102;
  private LinearLayout items;
  private TextView status;
  private Uri tree;
  private String currentDocument;
  private final java.util.ArrayList<String> folderStack=new java.util.ArrayList<>();
  private final java.util.ArrayList<String> nameStack=new java.util.ArrayList<>();

  @Override public void onCreate(Bundle state) { super.onCreate(state); draw(); String saved=getPreferences(0).getString("folder",null);
    if(saved!=null) {tree=Uri.parse(saved); try {currentDocument=DocumentsContract.getTreeDocumentId(tree); showFolder();} catch(Exception ignored){showRecent();}} else showRecent();
  }
  private int color(String value){return android.graphics.Color.parseColor(value);}
  private TextView label(String text,int size){TextView v=new TextView(this);v.setText(text);v.setTextSize(size);v.setTextColor(color("#eaf3ff"));v.setPadding(12,12,12,12);return v;}
  private void draw(){
    LinearLayout root=new LinearLayout(this);root.setOrientation(1);root.setPadding(22,18,22,12);root.setBackgroundColor(color("#081626"));
    root.addView(label("MAGNANIMOUS  •  DRIVE TV",25));
    status=label("Private TV player  |  no subscription for this owner build",15);root.addView(status);
    LinearLayout controls=new LinearLayout(this);controls.setOrientation(0);
    Button video=button("Choose video");video.setOnClickListener(v->pickVideo());controls.addView(video,new LinearLayout.LayoutParams(0,-2,1));
    Button folder=button("Choose folder");folder.setOnClickListener(v->pickFolder());controls.addView(folder,new LinearLayout.LayoutParams(0,-2,1));
    root.addView(controls);
    LinearLayout nav=new LinearLayout(this);nav.setOrientation(0);
    Button recent=button("Recent videos");recent.setOnClickListener(v->showRecent());nav.addView(recent,new LinearLayout.LayoutParams(0,-2,1));
    Button drive=button("Drive website");drive.setOnClickListener(v->openDrive());nav.addView(drive,new LinearLayout.LayoutParams(0,-2,1));
    root.addView(nav);
    ScrollView scroll=new ScrollView(this);items=new LinearLayout(this);items.setOrientation(1);scroll.addView(items);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
    setContentView(root);
  }
  private Button button(String value){Button b=new Button(this);b.setText(value);b.setTextSize(16);b.setAllCaps(false);b.setFocusable(true);b.setPadding(12,12,12,12);return b;}
  private void hint(String message){status.setText(message);}
  private void pickVideo(){Intent in=new Intent(Intent.ACTION_OPEN_DOCUMENT);in.addCategory(Intent.CATEGORY_OPENABLE);in.setType("video/*");in.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    try{startActivityForResult(in,PICK_VIDEO);}catch(ActivityNotFoundException ex){hint("No Android file picker on this TV. Try Drive website or install a compatible file manager.");}
  }
  private void pickFolder(){Intent in=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);in.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    try{startActivityForResult(in,PICK_FOLDER);}catch(ActivityNotFoundException ex){hint("This TV does not support the Android folder picker.");}
  }
  @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);
    if(result!=RESULT_OK||data==null||data.getData()==null)return;
    Uri selected=data.getData();
    try{getContentResolver().takePersistableUriPermission(selected,Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(Exception ignored){}
    if(request==PICK_VIDEO){String name=getDisplayName(selected);remember(selected,name);play(selected,name);}
    if(request==PICK_FOLDER){tree=selected;currentDocument=DocumentsContract.getTreeDocumentId(tree);folderStack.clear();nameStack.clear();getPreferences(0).edit().putString("folder",tree.toString()).apply();showFolder();}
  }
  private String getDisplayName(Uri u){String result="Video";try(Cursor c=getContentResolver().query(u,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){
    if(c!=null&&c.moveToFirst()) result=c.getString(0);}catch(Exception ignored){}return result;
  }
  private void remember(Uri uri,String name){try{JSONArray a=new JSONArray(getPreferences(0).getString("recent","[]"));JSONArray out=new JSONArray();
    JSONObject current=new JSONObject();current.put("uri",uri.toString());current.put("name",name);out.put(current);
    for(int i=0;i<a.length()&&out.length()<30;i++){JSONObject v=a.getJSONObject(i);if(!uri.toString().equals(v.optString("uri")))out.put(v);}
    getPreferences(0).edit().putString("recent",out.toString()).apply();}catch(Exception ignored){}
  }
  private void play(Uri uri,String name){remember(uri,name);Intent i=new Intent(this,PlayerActivity.class);i.putExtra("video_uri",uri.toString());i.putExtra("video_name",name);startActivity(i);}
  private void clear(){items.removeAllViews();}
  private void showRecent(){clear();hint("Recent files  •  Choose video or folder to begin");
    try{JSONArray a=new JSONArray(getPreferences(0).getString("recent","[]"));if(a.length()==0)items.addView(label("No videos selected yet. Choose video to open the Android file picker. If your Google Drive storage provider is available, select it there.",17));
      for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);Uri u=Uri.parse(o.getString("uri"));String name=o.getString("name");
        Button b=button("▶  "+name);b.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);b.setOnClickListener(v->play(u,name));items.addView(b);}
    }catch(Exception e){items.addView(label("Recent videos could not be loaded.",18));}
  }
  private void showFolder(){clear();if(tree==null||currentDocument==null){showRecent();return;}
    hint("Selected folder  •  Navigation and playback");
    if(!folderStack.isEmpty()){Button back=button("◀  Back to previous folder");back.setOnClickListener(v->{currentDocument=folderStack.remove(folderStack.size()-1);nameStack.remove(nameStack.size()-1);showFolder();});items.addView(back);}
    try{
      Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(tree,currentDocument);
      String[] fields={DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_MIME_TYPE};
      int count=0;
      try(Cursor c=getContentResolver().query(children,fields,null,null,null)){
        if(c!=null)while(c.moveToNext()){
          String id=c.getString(0), name=c.getString(1), mime=c.getString(2);
          if(name==null||mime==null)continue;
          boolean folder=DocumentsContract.Document.MIME_TYPE_DIR.equals(mime);
          boolean video=mime.startsWith("video/")||name.matches("(?i).*\\.(mp4|m4v|mkv|webm|mov|avi|3gp)$");
          if(!folder&&!video)continue;
          Uri file=DocumentsContract.buildDocumentUriUsingTree(tree,id);
          Button b=button((folder?"📁  ":"▶  ")+name);b.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);
          if(folder)b.setOnClickListener(v->{folderStack.add(currentDocument);nameStack.add(name);currentDocument=id;showFolder();});
          else b.setOnClickListener(v->play(file,name));
          items.addView(b);count++;
        }
      }
      if(count==0)items.addView(label("No video files found here, or your storage provider doesn't expose this folder.",17));
    }catch(Exception ex){items.addView(label("Couldn't browse this folder. Select another folder or individual video. "+ex.getClass().getSimpleName(),17));}
  }
  private void openDrive(){try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://drive.google.com/drive/u/0/my-drive")));}
    catch(Exception e){hint("No web browser available. Install a compatible browser from your TV app store.");}}
  @Override public void onBackPressed(){if(!folderStack.isEmpty()){currentDocument=folderStack.remove(folderStack.size()-1);nameStack.remove(nameStack.size()-1);showFolder();}else super.onBackPressed();}
}
