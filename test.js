#!/usr/bin/node

var fs=require('fs');

if(fs.existsSync('./ovh-config.json'))
	ovhConfig=require('./ovh-config.json')

var ovh=require('ovh')(ovhConfig);

ovh.request('GET', '/me',
function(error, result){
console.error(arguments);
});
