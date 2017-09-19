var fs=require('fs');

var ovhConfig={
  endpoint: 'ovh-eu',
  appKey: "LNnodRGJjPGKjvlj",
  appSecret: "1FafdjqJ67ne97VMtarJZaU0s0UGf3Jm",
};

if(fs.existsSync(__dirname+'/ovh-config.json'))
  var ovhConfig=require(__dirname+'/ovh-config.json');

var ovh=require('ovh')(ovhConfig);
var ps=require('child_process');

if(!ovhConfig.consumerKey)
ovh.request('POST', '/auth/credential', {
  'accessRules': [
    { 'method': 'GET', 'path': '/*'},
    { 'method': 'POST', 'path': '/domain/*'},
    { 'method': 'DELETE', 'path': '/domain/*'}
  ]
}, function (error, credential) {
console.log(credential);
console.log('please go to : '+credential.validationUrl);
var handled=true;
process.stdin.on('data', (data) => {
  ovhConfig.consumerKey=credential.consumerKey;
  fs.writeFileSync(__dirname+'/ovh-config.json', JSON.stringify(ovhConfig));
  console.log('savedSettings');
  console.log(ovhConfig);
  process.stdin.removeListener('data', arguments.callee);

ps.spawn('certbot',
['certonly', '--preferred-challenges',  'dns',
'--manual-auth-hook', __dirname+'/auth.js',
'--manual-cleanup-hook', __dirname+'/cleanup.js',
'-a', 'manual'].concat(process.argv.slice(2)), {'stdio':'inherit'});
  });
});
else
ps.spawn('certbot',
['certonly', '--preferred-challenges',  'dns',
'--manual-auth-hook', __dirname+'/auth.js',
'--manual-cleanup-hook', __dirname+'/cleanup.js',
'-a', 'manual'].concat(process.argv.slice(2)), {'stdio':'inherit'});
