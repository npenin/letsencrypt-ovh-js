var fs = require('fs');

var ovhConfig = {
  endpoint: 'ovh-eu',
  appKey: "LNnodRGJjPGKjvlj",
  appSecret: "1FafdjqJ67ne97VMtarJZaU0s0UGf3Jm",
};


if (process.argv.length < 3)
{
  console.log(process.argv);
  console.log('please enter the domain you would like a certificate for :');
  console.log(process.argv0 + ' . mydomainname.xx');
  process.exit(0);
}

if (fs.existsSync(__dirname + '/ovh-config.json'))
  var ovhConfig = require(__dirname + '/ovh-config.json');

var ovh = require('ovh')(ovhConfig);

var LE = require('greenlock');
var leStore = require('le-store-certbot').create({
  configDir: process.cwd()                                 // or /etc/letsencrypt or wherever
  , debug: false
});
var leDnsChallenge = require('./dnsChallenge').create({
  debug: false
});

console.log('please enter your mail:')
process.stdin.resume();
process.stdin.once('data', function (email)
{
  process.stdin.pause();
  if (Buffer.isBuffer(email))
  {

    email = email.toString('utf8');
    email = email.replace(/^[\r\n\s]+/g, '').replace(/[\r\n\s]+$/g, '');
    // console.log(email);
  }

  function leAgree(opts, agreeCb)
  {
    // opts = { email, domains, tosUrl }
    agreeCb(null, opts.tosUrl);
  }

  var le = le = LE.create({
    server: LE.productionServerUrl                             // or LE.productionServerUrl
    , store: leStore                                          // handles saving of config, accounts, and certificates
    , challenges: {
      'dns-01': leDnsChallenge
    }
    , challengeType: 'dns-01'                                // default to this challenge type
    , agreeToTerms: leAgree                                   // hook to allow user to view and accept LE TOS
    //, sni: require('le-sni-auto').create({})                // handles sni callback
    , debug: false
    // , log: function (...args) { console.log.apply(console, args); } // handles debug outputs
  });


  if (!ovhConfig.consumerKey)
    ovh.request('POST', '/auth/credential', {
      'accessRules': [
        { 'method': 'GET', 'path': '/*' },
        { 'method': 'POST', 'path': '/domain/*' },
        { 'method': 'DELETE', 'path': '/domain/*' }
      ]
    }, function (error, credential)
      {
        console.log(credential);
        console.log('please go to : ' + credential.validationUrl);
        console.log('then press a key');
        var handled = true;
        process.stdin.resume();
        process.stdin.once('data', (data) =>
        {
          process.stdin.pause();
          ovhConfig.consumerKey = credential.consumerKey;
          fs.writeFileSync(__dirname + '/ovh-config.json', JSON.stringify(ovhConfig));
          console.log('savedSettings');
          console.log(ovhConfig);

          start();
        });
      });
  else
    start();
  function start()
  {
    le.register({

      domains: process.argv.slice(2)
      , email: email
      , agreeTos: true
      , rsaKeySize: 2048
      , challengeType: 'dns-01'

    }).then(function (cert)
    {
      // console.log(cert);
      if (cert.expiresAt - new Date().valueOf() < 24 * 60 * 60000)
        le.renew({

          domains: process.argv.slice(2)
          , email: email
          , agreeTos: true
          , rsaKeySize: 2048
          , challengeType: 'dns-01'

        }, cert).then((results) =>
        {
          console.log(results);
          console.log('success');
        })
      else
        console.log('success');

    }, function (err)
      {

        // Note: you must either use le.middleware() with express,
        // manually use le.challenges['http-01'].get(opts, domain, key, val, done)
        // or have a webserver running and responding
        // to /.well-known/acme-challenge at `webrootPath`
        console.error('[Error]: node-greenlock/examples/standalone');
        console.error(err.stack);

      });

  }
});
