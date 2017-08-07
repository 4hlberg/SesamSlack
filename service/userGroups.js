var http = require('http');
var url = require('url');
var request = require("request");
var WebClient = require('@slack/client').WebClient;
var token = process.env.Token;
var web = new WebClient(token);


function updateUsergroup(group, callback) {
    var groupid = group["id"];
    var opts = {};
    opts.name = group["name"];
 
    web.usergroups.update(groupid, opts, function updategroup(err, response) {
           console.log(callback);
        if (err) {
            console.log('usergroup update-Error:', err);
        } else {
            var channel = group["channelid"];
            var name = shortenGroupName(group["name"]);
            web.channels.rename(channel, name, function renamechannel(channelerror, channelresponse){
                if (channelerror) {
                    console.log('channel-rename-Error:', channelerror);
                } else {        
                    console.log("rename is good");
                }
            }); 

           return callback(response);
        }
    });
};


function shortenGroupName(name) {
    
    var shortname = "";
    var regions = ["Stavanger", "Rogaland", "Øst", "Trondheim"];
    var shortword = {prosjektledelse:"prosjled", microsoft:"MS", rådgivning:"Råd", brukeropplevelse:"bo", administrasjon:"Admin", teknologi:"Tek"};   
    var splitname = name.split(" ");
    if(regions.indexOf(splitname[0]) != -1) {
        shortname = splitname[0].substring(0,3);
    } else {
        shortname = splitname[0];
    }
    for (i = 1; i < splitname.length; i++) {
        
        if(splitname[i].toLowerCase() in shortword) {
            shortname += " ";
            shortname += shortword[splitname[i].toLowerCase()];
        } else {
            if(splitname[i] == "&") {
                shortname += "-";
            } else {
                shortname += " ";
                shortname += splitname[i];
            }
        
        }
    }
    return shortname.substring(0,21);
};

  function CreateChannel(channel, callback) {
    var channelname = channel["name"]; 
    var name = shortenGroupName(channelname);
    web.channels.create(name, function(err, response) {
        if (err) {
        console.log("Err: " +err);
    } else {
        setTimeout(function() {
            console.log("channel created: " +name);
            return callback(response);
        }, 500);        
        }
    });
};

CreateUserGroup = function (group, channel, callback) {
    var groupname = group["name"];
    var opts = {};
    opts.channels = channel;
    web.usergroups.create(groupname, opts , function (err, response){
        if (err) {
            console.log("Err: " +err);
        } else {
            setTimeout(function() {
            return callback(response);
        }, 500);   
        }
    });
};

exports.Getusergroups = function(req,res){
    RetrieveUsergroups(function(usergrouplist) {
      Object(usergrouplist.usergroups).forEach(function(element, key, _array) {
      var deleted;
      
      if(element["deleted_by"]) {
        deleted = true;
      } else {
        deleted = false;
      }   
      element["_deleted"] = deleted;
      element["_updated"] = element["date_update"];
      element["_id"] = element["id"];
    });
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(usergrouplist));
  });
};
RetrieveUsergroups = function(callback) {
    web.usergroups.list(function teamInfoCb(err, reponse) {
        if (err) {
            console.log('Error:', err);
        } else {      
            return callback(reponse);
        }
    }); 

};


exports.PostGroup = function(req,res){ 
    console.log(req.body);
    var usergroups =  JSON.parse( JSON.stringify( req.body ) ); 
    console.log(usergroups);
    Object(usergroups).forEach(function(element, key, _array) {
      var channelid = "";
      if(element["_deleted"]) {
          //TODO Implementere støtte for deaktivering
        console.log("deactivate");
      } else {
        var name = shortenGroupName(element['name']);
        if(element['id'] > "") {  
          
          (element, function(group) {        
            console.log("UpdateUsergroup:" +group);
          });   
        } else {
          if(element['name'] != null) {
             // Prevent channel creation
            // CreateChannel(element, function(res) {              
               CreateUserGroup(element, res.channel.id,function(group) {
                 console.log("usergroupid: " +group);
              }); 
            // });
                  
          } else {
            console.log("Empty name" +element);
            console.log("null value detected. Skipping: " +element._id);
          }     
        }
      }
    });
    res.end(JSON.stringify(req.body));

};



