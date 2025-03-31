from flask import Flask, request, jsonify, send_file
import yt_dlp
import io
import os
import tempfile
from flask_cors import CORS
import requests
import subprocess
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def download_video(url, quality="1080"):
    format_code = {
        "2160": "bestvideo[height<=2160]+bestaudio/best[height<=2160]",
        "1440": "bestvideo[height<=1440]+bestaudio/best[height<=1440]",
        "1080": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "720": "bestvideo[height<=720]+bestaudio/best[height<=720]",
        "480": "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "360": "bestvideo[height<=360]+bestaudio/best[height<=360]",
    }
    selected_format = format_code.get(quality, format_code["1080"])
    
    # Create a temporary directory for yt-dlp to work with
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_file = os.path.join(temp_dir, "video.mp4")
        
        ydl_opts = {
            'format': selected_format,
            'outtmpl': temp_file,
            'merge_output_format': 'mp4',
            'quiet': False,
            'no_warnings': False,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                title = info.get('title', 'video')
                
                # Read the file into BytesIO buffer
                if os.path.exists(temp_file):
                    buffer = io.BytesIO()
                    with open(temp_file, 'rb') as f:
                        buffer.write(f.read())
                    buffer.seek(0)
                    return buffer, f"{title}.mp4"
                    
            # If the primary method fails, try the fallback
            return fallback_video_download(url, temp_dir)
                
        except Exception as e:
            print(f"yt-dlp failed with error: {str(e)}")
            return fallback_video_download(url, temp_dir)
    
    return None, None

def fallback_video_download(url, temp_dir):
    """Fallback method for video download using subprocess"""
    try:
        output_file = os.path.join(temp_dir, "video.mp4")
        subprocess.run([
            'yt-dlp', 
            '-f', 'best', 
            '-o', output_file,
            '--no-check-certificate',
            url
        ], check=True)
        
        if os.path.exists(output_file):
            buffer = io.BytesIO()
            with open(output_file, 'rb') as f:
                buffer.write(f.read())
            buffer.seek(0)
            return buffer, "video.mp4"
            
    except Exception as sub_error:
        print(f"Fallback video download failed: {str(sub_error)}")
    
    return None, None

def download_audio(url, quality="192"):
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_file = os.path.join(temp_dir, "audio.mp3")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(temp_dir, "audio"),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': quality,
            }],
            'quiet': False,
            'no_warnings': False,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                title = info.get('title', 'audio')
                
                # Find the audio file
                for file in os.listdir(temp_dir):
                    if file.endswith('.mp3'):
                        audio_path = os.path.join(temp_dir, file)
                        buffer = io.BytesIO()
                        with open(audio_path, 'rb') as f:
                            buffer.write(f.read())
                        buffer.seek(0)
                        return buffer, f"{title}.mp3"
                        
            # If the primary method fails, try the fallback
            return fallback_audio_download(url, temp_dir, quality)
                
        except Exception as e:
            print(f"yt-dlp failed with error: {str(e)}")
            return fallback_audio_download(url, temp_dir, quality)
    
    return None, None

def fallback_audio_download(url, temp_dir, quality):
    """Fallback method for audio download using subprocess"""
    try:
        output_template = os.path.join(temp_dir, "audio")
        subprocess.run([
            'yt-dlp', 
            '-x', 
            '--audio-format', 'mp3', 
            '--audio-quality', quality,
            '-o', output_template,
            '--no-check-certificate',
            url
        ], check=True)
        
        # Find the audio file
        for file in os.listdir(temp_dir):
            if file.endswith('.mp3'):
                audio_path = os.path.join(temp_dir, file)
                buffer = io.BytesIO()
                with open(audio_path, 'rb') as f:
                    buffer.write(f.read())
                buffer.seek(0)
                return buffer, "audio.mp3"
                
    except Exception as sub_error:
        print(f"Fallback audio download failed: {str(sub_error)}")
    
    return None, None

def download_thumbnail(url):
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            with yt_dlp.YoutubeDL({'quiet': False}) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    raise Exception("Could not fetch video info")
                    
                title = info.get('title', 'thumbnail')
                
                # Get the URL of the best thumbnail if available
                thumbnail_url = None
                if 'thumbnails' in info and len(info['thumbnails']) > 0:
                    thumbnails = sorted(info['thumbnails'], key=lambda x: x.get('width', 0) * x.get('height', 0), reverse=True)
                    thumbnail_url = thumbnails[0]['url']
                
                # If we got the thumbnail URL, download it directly
                if thumbnail_url:
                    response = requests.get(thumbnail_url, stream=True)
                    if response.status_code == 200:
                        buffer = io.BytesIO()
                        for chunk in response:
                            buffer.write(chunk)
                        buffer.seek(0)
                        return buffer, f"{title}.jpg"
            
            # If direct download failed, try yt-dlp thumbnail extraction
            temp_thumbnail = os.path.join(temp_dir, "thumbnail")
            ydl_opts = {
                'skip_download': True,
                'outtmpl': temp_thumbnail,
                'writethumbnail': True,
                'quiet': False,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl2:
                ydl2.download([url])
                
            # Find the thumbnail file
            for file in os.listdir(temp_dir):
                if file.endswith(('.jpg', '.png', '.webp')):
                    thumb_path = os.path.join(temp_dir, file)
                    buffer = io.BytesIO()
                    with open(thumb_path, 'rb') as f:
                        buffer.write(f.read())
                    buffer.seek(0)
                    return buffer, f"{title}.jpg"
                    
            return fallback_thumbnail_download(url, temp_dir)
                
        except Exception as e:
            print(f"Thumbnail download failed: {str(e)}")
            return fallback_thumbnail_download(url, temp_dir)
    
    return None, None

def fallback_thumbnail_download(url, temp_dir):
    """Fallback method for thumbnail download using subprocess"""
    try:
        output_template = os.path.join(temp_dir, "thumbnail")
        subprocess.run([
            'yt-dlp', 
            '--skip-download', 
            '--write-thumbnail', 
            '--convert-thumbnails', 'jpg',
            '-o', output_template,
            '--no-check-certificate',
            url
        ], check=True)
        
        # Find the thumbnail file
        for file in os.listdir(temp_dir):
            if file.endswith(('.jpg', '.png', '.webp')):
                thumb_path = os.path.join(temp_dir, file)
                buffer = io.BytesIO()
                with open(thumb_path, 'rb') as f:
                    buffer.write(f.read())
                buffer.seek(0)
                return buffer, "thumbnail.jpg"
                
    except Exception as sub_error:
        print(f"Fallback thumbnail download failed: {str(sub_error)}")
    
    return None, None

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'video')
    quality = data.get('quality', '1080')

    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        file_buffer = None
        filename = None
        
        if format_type == 'video':
            file_buffer, filename = download_video(url, quality)
        elif format_type == 'audio':
            file_buffer, filename = download_audio(url, quality)
        elif format_type == 'thumbnail':
            file_buffer, filename = download_thumbnail(url)
        else:
            return jsonify({'error': 'Invalid format type'}), 400
            
        if file_buffer and filename:
            return send_file(
                file_buffer,
                download_name=filename,
                as_attachment=True,
                mimetype='application/octet-stream'
            )
        else:
            return jsonify({'error': 'Failed to download content'}), 500
            
    except Exception as e:
        print(f"Download failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'error': 'Search query is required'}), 400
    
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': 'in_playlist',
            'default_search': 'ytsearch10:',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            results = ydl.extract_info(f"ytsearch10:{query}", download=False)
            
            if not results or 'entries' not in results:
                return jsonify([])
            
            videos = []
            for entry in results['entries']:
                # Format upload date
                upload_date = entry.get('upload_date', '')
                if upload_date:
                    try:
                        from datetime import datetime
                        date_obj = datetime.strptime(upload_date, '%Y%m%d')
                        upload_date = date_obj.strftime('%b %d, %Y')
                    except:
                        upload_date = ''

                videos.append({
                    'id': entry['id'],
                    'title': entry['title'],
                    'channel': entry.get('channel', 'Unknown Channel'),
                    'thumbnail': entry.get('thumbnail', ''),
                    'duration': entry.get('duration', 0),
                    'views': entry.get('view_count', 0),
                    'description': entry.get('description', ''),
                    'uploadDate': upload_date
                })
            
            return jsonify(videos)
            
    except Exception as e:
        print(f"Search failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)