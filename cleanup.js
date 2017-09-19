#!/usr/bin/node
var ovhConfig=require('./ovh-config.json')
console.log(ovhConfig);
var ovh = require('ovh')(ovhConfig);

var fqdn=process.env.CERTBOT_DOMAIN;

var indexOfTLD=fqdn.lastIndexOf('.');
var baseDomain=fqdn.substring(fqdn.lastIndexOf('.', indexOfTLD-1)+1);

//console.log(baseDomain);
//console.log('_acme-challenge.'+fqdn.substring(0,fqdn.length-baseDomain.length-1))

ovh.request('GET', '/domain/zone/'+baseDomain+'/record', {fieldType:'TXT', subDomain:'_acme-challenge.'+fqdn.substring(0,fqdn.length-baseDomain.length-1)}, function(error, result){
//console.log(arguments);
if(error)
console.error(error);
else
{
//console.log(arguments);
console.log(result);
ovh.request('DELETE', '/domain/zone/'+baseDomain+'/record/'+result[0], function(error, result){
if(error)
console.error(error);
else
{
	ovh.request('POST', '/domain/zone/'+baseDomain+'/refresh', function(error){
if(error)
console.error(error);
});
}
});
}
});
