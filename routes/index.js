var express = require('express');
var router = express.Router();
var LDAP = require('ldap-client');

/* GET home page. */
router.get('/', function(req, res, next) {

 
	var ldap = new LDAP({
	    uri:             'ldap://localhost',   // string 
	    validatecert:    true,             // Verify server certificate 
	    connecttimeout:  -1,                // seconds, default is -1 (infinite timeout), connect timeout 
	    base:            'cn=admin,dc=bla,dc=com',          // default base for all future searches 
	    attrs:           '*',               // default attribute list for future searches 
	    filter:          '(objectClass=*)', // default filter for all future searches 
	    scope:           LDAP.SUBTREE,      // optional function to call when disconnect occurs         
	}, function(err) {

		search_options = {
	    base: 'dc=bla,dc=com',
	    scope: LDAP.SUBTREE,
	    filter: '(objectClass=*)',
	    attrs: '*'
		}

		ldap.search(search_options, function(err,data){
			//console.log(data);
			tab=[];
			for(var i=0;i<data.length;i++){
				if(data[i].sn){
					tab.push(data[i])
				}
			}
			res.render('index', { title: 'Ldap', ldapsearch: tab });
		});
	    
	});

  
});





router.post('/add', function(req, res, next) {
	var ldap = new LDAP({
	    uri:             'ldap://localhost',   // string 
	    validatecert:    true,             // Verify server certificate 
	    connecttimeout:  -1,                // seconds, default is -1 (infinite timeout), connect timeout 
	    base:            'cn=admin,dc=bla,dc=com',          // default base for all future searches 
	    attrs:           '*',               // default attribute list for future searches 
	    filter:          '(objectClass=*)', // default filter for all future searches 
	    scope:           LDAP.SUBTREE,     // optional function to call when disconnect occurs         

	}, function(err) {
		var login = (req.body.login);
		var nom = (req.body.nom);
		var prenom = (req.body.prenom);
		var password = (req.body.password);
		var attrs = [
		    { attr: 'objectClass',  vals: [ 'top','person','organizationalPerson','inetOrgPerson' ] },
		    { attr: 'uid',      vals: [ login ] },
		    { attr: 'sn',           vals: [ nom ] },
		    { attr: 'givenName',      vals: [ prenom ] }
		    //TODO : Ajout password
		]

		bind_options = {
			binddn:'cn=admin,dc=bla,dc=com',
			password: 'bla'
		}

		ldap.bind(bind_options, function(err){
			ldap.add('uid='+login+',ou=people,dc=bla,dc=com',attrs, function(err){
				if(err){console.log("zertzertzer")
					console.log(err)
				}else{
					res.redirect('/');
				}	
			});
		});
		
	});
});

module.exports = router;
