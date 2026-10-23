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
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int PICK_MEDIA = 101;
    private static final int PICK_FOLDER = 102;
    private static final int MAX_QUEUE = 150; // Avoid oversized activity intents on 1 GB TV devices.
    private LinearLayout items;
    private TextView status;
    private Uri selectedTree;
    private String currentDocument;
    private final ArrayList<String> folderStack = new ArrayList<>();
    private final ArrayList<MediaEntry> visibleMedia = new ArrayList<>();

    static final class MediaEntry {
        final Uri uri;
        final String name;
        final boolean folder;
        final String id;
        MediaEntry(Uri uri, String name, boolean folder, String id) {
            this.uri=uri; this.name=name; this.folder=folder; this.id=id;
        }
    }

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        draw();
        String previous = getPreferences(0).getString("folder", null);
        if (previous == null) { showRecent(); return; }
        try {
            selectedTree = Uri.parse(previous);
            currentDocument = DocumentsContract.getTreeDocumentId(selectedTree);
            showFolder();
        } catch (Exception ex) {
            selectedTree = null;
            currentDocument = null;
            showRecent();
        }
    }

    private int color(String hex) { return android.graphics.Color.parseColor(hex); }

    private TextView label(String value, int size) {
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(size);
        v.setTextColor(color("#EAF3FF"));
        v.setPadding(14, 10, 14, 10);
        return v;
    }

    private Button button(String value) {
        Button b = new Button(this);
        b.setAllCaps(false);
        b.setText(value);
        b.setTextSize(15);
        b.setFocusable(true);
        b.setPadding(8, 8, 8, 8);
        return b;
    }

    private void draw() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(1);
        root.setPadding(20, 12, 20, 12);
        root.setBackgroundColor(color("#071321"));
        root.addView(label("MAGNANIMOUS DRIVE TV  ·  MEDIA LIBRARY", 24));
        status = label("Choose a song or video — built-in player opens automatically", 15);
        root.addView(status);

        LinearLayout first = new LinearLayout(this);
        first.setOrientation(LinearLayout.HORIZONTAL);
        Button pick = button("▶  Open video or song");
        pick.setOnClickListener(v -> pickMedia());
        first.addView(pick, new LinearLayout.LayoutParams(0, -2, 1));
        Button folder = button("▤  Open folder");
        folder.setOnClickListener(v -> pickFolder());
        first.addView(folder, new LinearLayout.LayoutParams(0, -2, 1));
        root.addView(first);

        LinearLayout second = new LinearLayout(this);
        second.setOrientation(LinearLayout.HORIZONTAL);
        Button recent = button("↺  Recently played");
        recent.setOnClickListener(v -> showRecent());
        second.addView(recent, new LinearLayout.LayoutParams(0, -2, 1));
        Button drive = button("Google Drive website");
        drive.setOnClickListener(v -> openDrive());
        second.addView(drive, new LinearLayout.LayoutParams(0, -2, 1));
        root.addView(second);

        ScrollView scroll = new ScrollView(this);
        items = new LinearLayout(this);
        items.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(items);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
        pick.requestFocus();
    }

    private void hint(String value) { status.setText(value); }

    private void pickMedia() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"video/*", "audio/*", "application/ogg", "application/octet-stream"});
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try { startActivityForResult(i, PICK_MEDIA); }
        catch (ActivityNotFoundException e) {
            hint("This TV has no compatible file picker. Install a file-manager/storage provider or try a USB drive.");
        }
    }

    private void pickFolder() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try { startActivityForResult(i, PICK_FOLDER); }
        catch (ActivityNotFoundException e) {
            hint("This TV does not support the Android folder picker.");
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (result != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try { getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); }
        catch (SecurityException | IllegalArgumentException ignored) { /* Provider may grant temporary access only. */ }

        if (request == PICK_MEDIA) {
            String name = displayName(uri);
            playSingle(uri, name);
        } else if (request == PICK_FOLDER) {
            selectedTree = uri;
            currentDocument = DocumentsContract.getTreeDocumentId(uri);
            folderStack.clear();
            getPreferences(0).edit().putString("folder", uri.toString()).apply();
            showFolder();
        }
    }

    private String displayName(Uri uri) {
        try (Cursor c = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                String name = c.getString(0);
                if (name != null && !name.isEmpty()) return name;
            }
        } catch (Exception ignored) {}
        String last = uri.getLastPathSegment();
        return last == null ? "Media" : last;
    }

    private boolean isMedia(String name, String mime) {
        String lower = name.toLowerCase(Locale.ROOT);
        return (mime != null && (mime.startsWith("video/") || mime.startsWith("audio/") || mime.equals("application/ogg")))
          || lower.matches(".*\\.(mp4|m4v|mkv|webm|mov|avi|3gp|ts|mpg|mpeg|mp3|m4a|aac|wav|flac|ogg|opus|wma|aiff|amr)$");
    }

    private void remember(Uri uri, String name) {
        try {
            JSONArray current = new JSONArray(getPreferences(0).getString("recent", "[]"));
            JSONArray updated = new JSONArray();
            JSONObject first = new JSONObject();
            first.put("uri", uri.toString());
            first.put("name", name);
            updated.put(first);
            for (int j=0; j<current.length() && updated.length()<30; j++) {
                JSONObject e=current.getJSONObject(j);
                if (!uri.toString().equals(e.optString("uri"))) updated.put(e);
            }
            getPreferences(0).edit().putString("recent", updated.toString()).apply();
        } catch (Exception ignored) {}
    }

    private void playSingle(Uri uri, String name) {
        ArrayList<MediaEntry> queue = new ArrayList<>();
        queue.add(new MediaEntry(uri, name, false, ""));
        openPlayer(queue, 0);
    }

    private void openPlayer(List<MediaEntry> list, int selection) {
        if (list.isEmpty() || selection < 0 || selection >= list.size()) return;
        MediaEntry selected = list.get(selection);
        remember(selected.uri, selected.name);
        ArrayList<String> uriList = new ArrayList<>();
        ArrayList<String> nameList = new ArrayList<>();
        int index = 0;
        // On large libraries, include 149 subsequent items, wrapping around when necessary.
        for (int step=0; step<Math.min(list.size(), MAX_QUEUE); step++) {
            int cursor=(selection+step)%list.size();
            MediaEntry media=list.get(cursor);
            uriList.add(media.uri.toString());
            nameList.add(media.name);
        }
        Intent i = new Intent(this, PlayerActivity.class);
        i.putStringArrayListExtra(PlayerActivity.EXTRA_URIS, uriList);
        i.putStringArrayListExtra(PlayerActivity.EXTRA_NAMES, nameList);
        i.putExtra(PlayerActivity.EXTRA_INDEX, index);
        startActivity(i);
    }

    private void clear() { items.removeAllViews(); }

    private void showRecent() {
        clear();
        hint("Recently selected songs and videos  ·  Select one to play");
        try {
            JSONArray json = new JSONArray(getPreferences(0).getString("recent", "[]"));
            ArrayList<MediaEntry> media = new ArrayList<>();
            for (int j=0; j<json.length(); j++) {
                JSONObject e=json.getJSONObject(j);
                if (e.has("uri") && e.has("name")) media.add(new MediaEntry(Uri.parse(e.getString("uri")), e.getString("name"), false, ""));
            }
            if (media.isEmpty()) items.addView(label("No songs or videos selected yet. Select Open video or song. If Google Drive is not available in the picker, use a supported storage provider or USB device.", 18));
            for (int i=0; i<media.size(); i++) {
                final int start=i;
                Button b=button("▶  "+media.get(i).name);
                b.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);
                b.setOnClickListener(v->openPlayer(media, start));
                items.addView(b);
            }
        } catch (Exception e) {
            items.addView(label("Could not load the recent media list.", 17));
        }
    }

    private void showFolder() {
        clear();
        if (selectedTree == null || currentDocument == null) { showRecent(); return; }
        hint("Folder library  ·  Select any file to launch built-in player and Up Next queue");
        if (!folderStack.isEmpty()) {
            Button back = button("◀  Parent folder");
            back.setOnClickListener(v-> {
                currentDocument=folderStack.remove(folderStack.size()-1);
                showFolder();
            });
            items.addView(back);
        }

        ArrayList<MediaEntry> found = new ArrayList<>();
        try {
            Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(selectedTree, currentDocument);
            String[] fields={
                DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                DocumentsContract.Document.COLUMN_MIME_TYPE
            };
            try(Cursor c=getContentResolver().query(children, fields, null, null, null)) {
                if (c != null) while(c.moveToNext()) {
                    String id=c.getString(0), name=c.getString(1), mime=c.getString(2);
                    if (id==null || name==null || mime==null) continue;
                    boolean folder=DocumentsContract.Document.MIME_TYPE_DIR.equals(mime);
                    if (!folder && !isMedia(name,mime)) continue;
                    found.add(new MediaEntry(DocumentsContract.buildDocumentUriUsingTree(selectedTree,id), name, folder, id));
                }
            }
        } catch (Exception e) {
            items.addView(label("Couldn't read this folder. Try choosing it again. "+e.getClass().getSimpleName(), 17));
            return;
        }
        Collections.sort(found, new Comparator<MediaEntry>() {
            @Override public int compare(MediaEntry a, MediaEntry b) {
                if(a.folder!=b.folder)return a.folder?-1:1;
                return a.name.compareToIgnoreCase(b.name);
            }
        });

        visibleMedia.clear();
        for (MediaEntry entry:found) if(!entry.folder) visibleMedia.add(entry);

        for (MediaEntry entry:found) {
            Button b=button((entry.folder?"▤  ":"▶  ")+entry.name);
            b.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);
            if (entry.folder) {
                b.setOnClickListener(v-> {
                    folderStack.add(currentDocument);
                    currentDocument=entry.id;
                    showFolder();
                });
            } else {
                b.setOnClickListener(v-> {
                    int i=visibleMedia.indexOf(entry);
                    openPlayer(visibleMedia, i);
                });
            }
            items.addView(b);
        }
        if (found.isEmpty()) items.addView(label("There are no supported media files in this folder, or this storage provider does not expose them.", 17));
    }

    private void openDrive() {
        try {startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://drive.google.com/drive/u/0/my-drive")));}
        catch(Exception e){hint("No external browser is available. Use the file picker or USB storage.");}
    }

    @Override public void onBackPressed() {
        if (!folderStack.isEmpty()) {
            currentDocument=folderStack.remove(folderStack.size()-1);
            showFolder();
        } else super.onBackPressed();
    }
}
