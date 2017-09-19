#!/usr/bin/node

var fs=require('fs');

var ovhConfig={
  endpoint: 'ovh-eu',
  appKey: "LNnodRGJjPGKjvlj",
  appSecret: "1FafdjqJ67ne97VMtarJZaU0s0UGf3Jm",
};

if(fs.existsSync('./ovh-config.json'))
	ovhConfig=require('./ovh-config.json')

var ovh=require('ovh')(ovhConfig);

function registerZone(){
var fqdn=process.env.CERTBOT_DOMAIN;
var token='"'+process.env.CERTBOT_VALIDATION+'"';

var indexOfTLD=fqdn.lastIndexOf('.');
var baseDomain=fqdn.substring(fqdn.lastIndexOf('.', indexOfTLD-1)+1);

//console.log(baseDomain);
//console.log('_acme-challenge.'+fqdn.substring(0,fqdn.length-baseDomain.length-1))

ovh.request('POST', '/domain/zone/'+baseDomain+'/record',
{fieldType:'TXT',
subDomain:'_acme-challenge.'+fqdn.substring(0,fqdn.length-baseDomain.length-1),
ttl:0,
target:token},
function(error, result){
if(error)
console.error(arguments);
else
{
//        console.log(result.id);
        ovh.request('POST', '/domain/zone/'+baseDomain+'/refresh', function(error){
	if(error)
	console.error(error);
else
	        setTimeout(function(){}, 5000);
	});
}
});
}
registerZone();
