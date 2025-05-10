from flask import Flask, send_from_directory, render_template
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)

def is_file_exists(path):
    safe_path = os.path.normpath(path).lstrip(os.sep)
    return os.path.isfile(safe_path)

@app.route('/')
@app.route('/<path:subpath>')
def dynamic_route(subpath=None):
    if not subpath:
        if is_file_exists('index.html'):
            return render_template('index.html')
        return "Index file not found", 404
    
    if is_file_exists(subpath):
        return send_from_directory('.', subpath)
    
    if os.path.isdir(subpath) and is_file_exists(os.path.join(subpath, 'index.html')):
        return send_from_directory(subpath, 'index.html')
    
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
