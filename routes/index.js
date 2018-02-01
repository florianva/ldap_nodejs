var express = require('express');
var session = require('express-session')
var router = express.Router();
var ldap = require('ldapjs');
var ssha = require('node-ssha256');
var maxUidNumber = 0;

/* GET home page. */
router.get('/', function(req, res, next) {

	if(req.session.isConnected == undefined || !req.session.isConnected ){
		res.redirect('/login');
	}


  var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
  })

  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){
  	var opts = {
	  filter: '(objectClass=*)',
	  scope: 'sub',
	  attributes: ['*']
	};

		client.search('ou=people, dc=bla,dc=com', opts, function(err, resu) {
		  var tab = []
		  resu.on('searchEntry', function(entry) {
		  	tab.push(JSON.parse(JSON.stringify(entry.object)));
		  });
		 
		
		  resu.on('end', function(result) {
		  	// convert json users to array users
		    table = []
		    for(var i=0;i<tab.length;i++){
				if(tab[i].sn){
					table.push(tab[i])
					if (parseInt(tab[i].uidNumber) > maxUidNumber){
						maxUidNumber = parseInt(tab[i].uidNumber);
					}
				}
			}


			client.search('ou=group, dc=bla,dc=com', opts, function(err, resu) {
				  var tabGrp = []
				  resu.on('searchEntry', function(entry) {
				  	tabGrp.push(JSON.parse(JSON.stringify(entry.object)));
				  });
				 
				
				  resu.on('end', function(result) {
				    tableGrp = []
				    for(var i=0;i<tabGrp.length;i++){
						tableGrp.push(tabGrp[i])
					}
					res.render('index', { title: 'Ldap', ldapsearch: table, groups : tableGrp });
				  });

			});


		  });
		});
	})

});


router.get('/disconnect', function(req, res, next) {
	req.session.isConnected = false;
	res.redirect('/');
});

router.get('/login', function(req, res, next) {
	res.render('login');
});

router.get('/nousergroup', function(req, res, next) {

	var group = (req.param('group'));
	if(group==undefined){
		res.json("");
	}else{

	  var client = ldap.createClient({
	  	url: 'ldap://127.0.0.1'
	  })

	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){
	  	var opts = {
		  filter: '(objectClass=*)',
		  scope: 'sub',
		  attributes: ['*']
		};

			client.search('ou=people, dc=bla,dc=com', opts, function(err, resu) {
			  var tab = []
			  resu.on('searchEntry', function(entry) {
			  	tab.push(JSON.parse(JSON.stringify(entry.object)));
			  });
			 
			
			  resu.on('end', function(result) {
			  	// convert json users to array users
				var optsGrp = {
				  filter: '(objectClass=*)',
				  scope: 'sub',
				  attributes: ['*']
				};

				client.search('cn='+group+',ou=group, dc=bla,dc=com', optsGrp, function(err, resu) {
					var tableUser = []
					    
					 var tabGrp = []
					 resu.on('searchEntry', function(entry) {
					  	tabGrp.push(JSON.parse(JSON.stringify(entry.object)));
					 });
					
					 resu.on('end', function(result) {
					    memberInGrp = tabGrp[0].memberUid;
					    for(var i=0;i<tab.length;i++){
							if((tab[i].sn && memberInGrp && memberInGrp.indexOf(tab[i].uid) == -1) || memberInGrp == undefined){
								if(tab[i].uid != undefined )tableUser.push(tab[i])
							}
						}
						res.json(tableUser);
					});

				});

			  });
			});
		})
	}

});


router.get('/usergroup', function(req, res, next) {

	var group = (req.param('group'));
	if(group==undefined){
		res.json("");
	}else{

	  var client = ldap.createClient({
	  	url: 'ldap://127.0.0.1'
	  })

	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){
	  	var opts = {
		  filter: '(objectClass=*)',
		  scope: 'sub',
		  attributes: ['*']
		};

			client.search('ou=people, dc=bla,dc=com', opts, function(err, resu) {
			  var tab = []
			  resu.on('searchEntry', function(entry) {
			  	tab.push(JSON.parse(JSON.stringify(entry.object)));
			  });
			 
			
			  resu.on('end', function(result) {
			  	// convert json users to array users
				var optsGrp = {
				  filter: '(objectClass=*)',
				  scope: 'sub',
				  attributes: ['*']
				};

				client.search('cn='+group+',ou=group, dc=bla,dc=com', optsGrp, function(err, resu) {
					var tableUser = []
					    
					 var tabGrp = []
					 resu.on('searchEntry', function(entry) {
					  	tabGrp.push(JSON.parse(JSON.stringify(entry.object)));
					 });
					
					 resu.on('end', function(result) {
					     memberInGrp = tabGrp[0].memberUid;
					    for(var i=0;i<tab.length;i++){
							if((tab[i].sn && memberInGrp && memberInGrp.indexOf(tab[i].uid) != -1)){
								if(tab[i].uid != undefined )tableUser.push(tab[i])
							}
						}
						res.json(tableUser);
					});

				});

			  });
			});
		})
	}

});

router.post('/login', function(req, res, next) {

	var login = (req.body.login);
	var mdp = (req.body.password);

	 var client = ldap.createClient({
	  	url: 'ldap://127.0.0.1'
	  })

	client.bind('cn='+login+',dc=bla,dc=com',mdp,function(err){
		if(err){
			console.log(err);
			console.log('cn='+login+',dc=bla,dc=com')
			console.log(mdp);
			res.redirect('/login');
		}
		else{
			req.session.isConnected = true;

			req.session.login = login;
			req.session.mdp = mdp;

			res.redirect('/');
		}

	});
});



router.post('/add', function(req, res, next) {

	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })

	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){

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
	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){

		var login = (req.body.login);
		client.del('uid='+login+',ou=people,dc=bla,dc=com', function(err) {
			if(err) console.log(err);
			res.redirect('/');
		});
	})

});

router.post('/deleteall', function(req, res, next) {
	var users = (req.body.users);
	var client = ldap.createClient({
  		url: 'ldap://127.0.0.1'
	 });
	client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){
		var size = users.length
		users.forEach(function(item, index, object){
			client.del('uid='+item+',ou=people,dc=bla,dc=com', function(err) {
			size = size - 1;
			if(size == 0) res.redirect('/');
			});
		})
		if(err) console.log(err);
		
	});

});



router.post('/modify', function(req, res, next) {

	var login = (req.body.login);
	var attribut = (req.body.attribut);
	var value = (req.body.value);

	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })
	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){

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




router.post('/add-group', function(req, res, next) {
	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })

	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){

		var nom = (req.body.nom);

		var entry = {
			cn: nom,
			gidNumber : 1500+(Math.floor(Math.random()*Math.floor(20000))),
			objectclass: ['top', 'posixGroup']
		};
		client.add('cn='+nom+',ou=group,dc=bla,dc=com', entry, function(err) {
			if(err) console.log(err);
			res.redirect('/');
		});
	})

});


router.post('/delete-group', function(req, res, next) {
	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })
	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){

		var nom = (req.body.nom);
		client.del('cn='+nom+',ou=group,dc=bla,dc=com', function(err) {
			if(err) console.log(err);
			res.redirect('/');
		});
	})
});


router.post('/modify-group-add', function(req, res, next) {
	var uid = (req.body.uid);
	var group = (req.body.group);


	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })
	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){

	  	var modif = {memberUid:uid}
	  	
	  	var change = new ldap.Change({
		  operation: 'add',
		  modification: modif
		});

		client.modify('cn='+group+',ou=group,dc=bla,dc=com', change, function(err) {
		  if(err) console.log(err);
		  res.redirect('/');
		});			
	})

});


router.post('/modify-group-rm', function(req, res, next) {
	var uid = (req.body.uid);
	var group = (req.body.group);

	var client = ldap.createClient({
  	url: 'ldap://127.0.0.1'
	  })
	  client.bind('cn='+req.session.login+',dc=bla,dc=com',req.session.mdp,function(err){

	  	var modif = {memberUid:uid}
	  	
	  	var change = new ldap.Change({
		  operation: 'delete',
		  modification: modif
		});

		client.modify('cn='+group+',ou=group,dc=bla,dc=com', change, function(err) {
		  if(err) console.log(err);
		  res.redirect('/');
		});			
	})

});




module.exports = router;
