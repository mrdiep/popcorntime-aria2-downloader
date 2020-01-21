import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import axios from 'axios';
import Aria2 from "aria2";

const upload = multer();
const app = express();
const port = 3000;

app.use(express.static('public'));

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(upload.array()); 
app.set('view engine', 'pug')
app.get('/conf', (req, res) => {
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.write('dirnamae: ' + __dirname);

    const child_process = require('child_process');
    child_process.exec('node -v', function (err, stdout) {
        res.write('\r\ns-out: ' + stdout.toString().trim());
    })
    
});

app.get('/fetch',  async (req, res) => {
    var size = req.query.size || 500
    var k = [];
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    for (var i = 1; i<=size;i++) {
        res.write('url: ' + ("https://api.apiumadomain.com/list?quality=1080p&page=" + i + " => " + k.length) + '\n\n');
        var e = await axios.get("https://api.apiumadomain.com/list?quality=1080p&page=" + i);
        if (e.data.MovieList.length == 0) {
            break;
        }

        k=[...k, ...e.data.MovieList];
    }

    res.write('fetch done: ' + k.length);

    fs.writeFile("./src/raw-data.json", JSON.stringify(k, null, 4), () => {});
    fs.writeFile("./src/filtered-data.json", JSON.stringify(k
        .filter(x => x.runtime > 100 && x.rating >= 3 && x.year >= 1980 && !x.genres.some(t => t == "documentary"))
        .map(x => { return {
            genres: x.genres,
            items: x.items
                .filter(t => t.quality == '1080p')
                .map(t => ({file: t.file, quality: t.quality, size_bytes: t.size_bytes, torrent_magnet: t.torrent_magnet})),
            poster_big: x.poster_big,
            rating: x.rating,
            runtime: x.runtime,
            title: x.title,
            year: x.year
        }
    }), null, 4), () => {});;
});

app.get('/', (req, res) => {
    var genre = req.query.genre
    var minRating= req.query.rating || 5.0
    var minYear= req.query.year || 1980

    var dataList = JSON.parse(fs.readFileSync( __dirname + '/data.json', 'UTF-8'));

    
    var filterList = dataList.filter(x => x.year >= minYear && x.rating >= minRating && !x.genres.some(t => t == "documentary") && x.runtime > 100
     && (!genre || x.genres.indexOf(genre) != -1)
    );

    filterList = filterList.sort((y, x) => x.year - y.year)
    var genres = Object.keys(filterList.map(x => x.genres).reduce((l, e) => { e.forEach(c => l[c] = 1); return l; } , {}));
    return res.render('index', { list: filterList, genres: genres })
})

app.get('/data', (req, res) => {
    var genre = req.query.genre
    var minRating= req.query.rating || 6.0
    var minYear= req.query.year || 1980

    var dataList = JSON.parse(fs.readFileSync( __dirname + '/filtered-data.json', 'UTF-8'));

    var filterList = dataList.filter(x => x.year >= minYear && x.rating >= minRating && !x.genres.some(t => t == "documentary") && x.runtime > 100
     && (!genre || x.genres.indexOf(genre) != -1)
    );

    filterList = filterList.sort((y, x) => x.year - y.year)
    var genres = Object.keys(filterList.map(x => x.genres).reduce((l, e) => { e.forEach(c => l[c] = 1); return l; } , {}));
    return res.json({ list: filterList, genres: genres });
})

app.post('/', function(req, res){
   console.log(req.body);
    const aria2 = new Aria2({
        host: 'localhost',
        port: 6800,
        secure: false,
        secret: '',
        path: '/jsonrpc'
    });

    aria2
    .open()
    .then(async () => {
        const magnet = req.body.torrent_magnet;
        const [guid] = await aria2.call("addUri", [magnet]);

        res.json({message: 'Received torrent. Status: Downloading'});
    })
    .catch(err => {
        res.json({message: 'Received torrent. Status: Fail'});
    });

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))