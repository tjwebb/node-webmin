var request = require('request');
var targz = require('tar.gz');
var rimraf = require('rimraf');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var version = parseVersion(require('./package').version);
var url = parseUrl(version);
var pkg = 'webmin-'+ version;
var dist = path.resolve(__dirname, 'dist');
var opt = path.resolve(__dirname, 'opt');
var tarball = path.resolve(__dirname, pkg + '.tgz');

if (fs.existsSync(tarball)) {
  onDownloaded();
}
else {
  console.log('webmin: Downloading...');
  request(url).pipe(
    fs.createWriteStream(tarball)
      .on('finish', onDownloaded)
      .on('error', onError)
    );
}

function parseVersion (version) {
  var split = version.replace(/\-r[0-9]+$/, '').split('.');
  return split[0] + '.' + split[1] + split[2];
}
function parseUrl (version) {
  return 'http://prdownloads.sourceforge.net/webadmin/webmin-' + version + '.tar.gz';
}

function onExtracted (err) {
  if (err) onError(err);

  console.log('webmin: Installing...');
  var setup = spawn(path.resolve(dist, pkg, 'setup.sh'), [ opt ], {
    env: {
      config_dir: path.resolve(__dirname, 'etc'),
      var_dir: path.resolve(__dirname, 'log'),
      perl: '/usr/bin/perl',
      port: 10000,
      login: process.env.WEBMIN_USER,
      password: process.env.WEBMIN_PASSWORD,
      password2: process.env.WEBMIN_PASSWORD,
      ssl: 0,
      atboot: 1
    }
  });
  setup.stdout.on('data', function (data) {
    console.log(('setup.sh: ' + data).trim());
  });
  setup.on('error', onError);
  setup.on('exit', function (err) {
    rimraf.sync(dist);
    rimraf.sync(tarball);
    process.exit(0);
  });
}

function onDownloaded () {
  console.log('webmin: Extracting...');
  new targz().extract(tarball, dist, onExtracted);
}

function onError (err) {
  throw err;
}
