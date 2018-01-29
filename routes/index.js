var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var ssha = require('node-ssha256');
var maxUidNumber = 0;

/* GET home page. */
router.get('/', function(req, res, next) {


  var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
  })

  client.bind('cn=admin,dc=bla,dc=com','bla',function(err){
  	var opts = {
	  filter: '(objectClass=*)',
	  scope: 'sub',
	  attributes: ['*']
	};

		client.search('ou=people, dc=bla,dc=com', opts, function(err, resu) {
		  var tab = []
		  resu.on('searchEntry', function(entry) {
		  	console.log(JSON.stringify(entry.object));
		  	tab.push(JSON.parse(JSON.stringify(entry.object)));
		  });
		  resu.on('searchReference', function(referral) {
		    console.log('referral: ' + referral.uris.join());
		  });
		  resu.on('error', function(err) {
		    console.error('error: ' + err.message);
		  });
		  resu.on('end', function(result) {
		    console.log('status: ' + result.status);
		    table = []
		    for(var i=0;i<tab.length;i++){
				if(tab[i].sn){
					table.push(tab[i])
					if (parseInt(tab[i].uidNumber) > maxUidNumber){
						maxUidNumber = parseInt(tab[i].uidNumber);
					}
				}
			}
				res.render('index', { title: 'Ldap', ldapsearch: table });
		  });
		});
	})

});


router.post('/add', function(req, res, next) {

	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })

	  client.bind('cn=admin,dc=bla,dc=com','bla',function(err){

		var login = (req.body.login);
		var nom = (req.body.nom);
		var prenom = (req.body.prenom);
		var password = (req.body.password);

		var entry = {
			cn: login,
			uid: login,
			uidNumber : maxUidNumber+1,
			gidNumber : maxUidNumber+1,
			homeDirectory:'/home/'+login,
			sn: nom,
			givenName: prenom,
			objectclass: ['top','person','organizationalPerson','inetOrgPerson', 'shadowAccount', 'posixAccount'],
			userPassword: ssha.create(password)
		};
		client.add('uid='+login+',ou=people,dc=bla,dc=com', entry, function(err) {
			if(err) console.log(err);
			maxUidNumber = maxUidNumber+1;
			res.redirect('/');
		});
	})

});

router.post('/delete', function(req, res, next) {

	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })
	  client.bind('cn=admin,dc=bla,dc=com','bla',function(err){

		var login = (req.body.login);
		client.del('uid='+login+',ou=people,dc=bla,dc=com', function(err) {
			if(err) console.log(err);
			res.redirect('/');
		});
	})

});



router.post('/modify', function(req, res, next) {

	var login = (req.body.login);
	var attribut = (req.body.attribut);
	var value = (req.body.value);

	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })
	  client.bind('cn=admin,dc=bla,dc=com','bla',function(err){

	  	var modif = {}
	  	if(attribut == 'nom'){
	  		modif = { sn:value }
	  	}else if(attribut == 'prenom'){
	  		modif = { givenName:value }
	  	}else if(attribut == 'password'){
	  		modif = { userPassword: ssha.create(value) }
	  	}

	  	var change = new ldap.Change({
		  operation: 'replace',
		  modification: modif
		});

		client.modify('uid='+login+',ou=people,dc=bla,dc=com', change, function(err) {
		  if(err) console.log(err);
		  res.redirect('/');
		});
				
	})

});




module.exports = router;
