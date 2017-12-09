'use strict';

var PromiseA = require('bluebird');
var dns = PromiseA.promisifyAll(require('dns'));
var fs = require('fs');
var Challenge = module.exports;


var ovhConfig = {
    endpoint: 'ovh-eu',
    appKey: "LNnodRGJjPGKjvlj",
    appSecret: "1FafdjqJ67ne97VMtarJZaU0s0UGf3Jm",
};

if (fs.existsSync(__dirname + '/ovh-config.json'))
    ovhConfig = require('./ovh-config.json')

var ovh = require('ovh')(ovhConfig);

function registerZone(fqdn, token, cb)
{
    if (token[0] != '"')
        token = '"' + token + '"';

    var indexOfTLD = fqdn.lastIndexOf('.');
    var baseDomain = fqdn.substring(fqdn.lastIndexOf('.', indexOfTLD - 1) + 1);

    //console.log(baseDomain);
    //console.log('_acme-challenge.'+fqdn.substring(0,fqdn.length-baseDomain.length-1))

    ovh.request('POST', '/domain/zone/' + baseDomain + '/record',
        {
            fieldType: 'TXT',
            subDomain: '_acme-challenge.' + fqdn.substring(0, fqdn.length - baseDomain.length - 1),
            ttl: 0,
            target: token
        },
        function (error, result)
        {
            if (error)
                console.error(arguments);
            else
            {
                //        console.log(result.id);
                ovh.request('POST', '/domain/zone/' + baseDomain + '/refresh', function (error)
                {
                    if (error)
                        console.error(error);
                    else
                        setTimeout(function () { cb(null); }, 5000);
                });
            }
        });
}


Challenge.create = function (defaults)
{
    return {
        getOptions: function ()
        {
            return defaults || {};
        }
        , set: Challenge.set
        , get: Challenge.get
        , remove: Challenge.remove
        , loopback: Challenge.loopback
        , test: Challenge.test
    };
};

// Show the user the token and key and wait for them to be ready to continue
Challenge.set = function (args, domain, challenge, keyAuthorization, cb)
{
    var keyAuthDigest = require('crypto').createHash('sha256').update(keyAuthorization || '').digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
        ;
    var challengeDomain = (args.test || '') + domain;

    registerZone(challengeDomain, keyAuthDigest, cb);
};

// nothing to do here, that's why it's manual
Challenge.get = function (defaults, domain, challenge, cb)
{
    cb(null);
};

// might as well tell the user that whatever they were setting up has been checked
Challenge.remove = function (args, domain, challenge, cb)
{
    var fqdn = domain;
    var indexOfTLD = fqdn.lastIndexOf('.');
    var baseDomain = fqdn.substring(fqdn.lastIndexOf('.', indexOfTLD - 1) + 1);

    //console.log(baseDomain);
    //console.log('_acme-challenge.'+fqdn.substring(0,fqdn.length-baseDomain.length-1))

    ovh.request('GET', '/domain/zone/' + baseDomain + '/record', { fieldType: 'TXT', subDomain: '_acme-challenge.' + fqdn.substring(0, fqdn.length - baseDomain.length - 1) }, function (error, result)
    {
        //console.log(arguments);
        if (error)
            console.error(error);
        else
        {
            //console.log(arguments);
            console.log(result);
            ovh.request('DELETE', '/domain/zone/' + baseDomain + '/record/' + result[0], function (error, result)
            {
                if (error)
                    console.error(error);
                else
                {
                    ovh.request('POST', '/domain/zone/' + baseDomain + '/refresh', function (error)
                    {
                        if (error)
                            console.error(error);
                        else
                            cb(null);
                    });
                }
            });
        }
    });
};

Challenge.loopback = function (defaults, domain, challenge, done)
{
    var challengeDomain = (defaults.test || '') + domain;
    console.log("dig TXT +noall +answer @8.8.8.8 '" + challengeDomain + "' # " + challenge);
    dns.resolveTxtAsync(challengeDomain).then(function (x) { done(null, x); }, done);
};