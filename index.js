var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var inflection = require('inflection');
var Twit = require('twit');
var wordfilter = require('wordfilter');

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

function generate() {
  var dfd = new _.Deferred();
  var urls = ['http://archiveofourown.org/tags/Harry%20Potter%20-%20J*d*%20K*d*%20Rowling/works',
  'http://archiveofourown.org/tags/Sherlock%20Holmes%20*a*%20Related%20Fandoms/works',
  'http://archiveofourown.org/tags/Arthurian%20Mythology%20*a*%20Related%20Fandoms/works',
  'http://archiveofourown.org/tags/TOLKIEN%20J*d*%20R*d*%20R*d*%20-%20Works/works',
  'http://archiveofourown.org/tags/Les%20Mis%C3%A9rables%20-%20All%20Media%20Types/works',
  'http://archiveofourown.org/tags/Marvel/works',
  'http://archiveofourown.org/tags/One%20Direction%20(Band)/works',
  'http://archiveofourown.org/tags/Bandom/works',
  'http://archiveofourown.org/tags/DCU/works',
  'http://archiveofourown.org/tags/Supernatural/works',
  'http://archiveofourown.org/tags/Dragon%20Age%20-%20All%20Media%20Types/works',
  'http://archiveofourown.org/tags/Final%20Fantasy/works',
  'http://archiveofourown.org/tags/Mass%20Effect/works',
  'http://archiveofourown.org/tags/Star%20Wars%20-%20All%20Media%20Types/works',
  'http://archiveofourown.org/tags/Teen%20Wolf%20(TV)/works',
  'http://archiveofourown.org/tags/Star%20Trek:%20The%20Original%20Series/works',
  'http://archiveofourown.org/tags/Star%20Trek:%20The%20Next%20Generation/works',
  'http://archiveofourown.org/tags/Game%20of%20Thrones%20(TV)/works',
  'http://archiveofourown.org/tags/Doctor%20Who%20*a*%20Related%20Fandoms/works',
  'http://archiveofourown.org/tags/Battlestar%20Galactica%20(2003)/works'
  ];
  var result = [];
  _.each(urls, function (url) {
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        // parse stuff and resolve
        result.push($('#tag_category_character > ul > li').map(function(ind, el) { return($(el).text().replace(/\(.*\)/,'').trim())}));
        if (result.length === urls.length) {
          result = _.flatten(result);
          for (var i=0; i<20; i++) {
            console.log(result.pick() + ' and ' + result.pick());
          }
        }
      }
      else {
        dfd.reject();
      }
    });
  });

  return dfd.promise();
}

function tweet() {
  generate().then(function(myTweet) {
    if (!wordfilter.blacklisted(myTweet)) {
      console.log(myTweet);
      /*
      T.post('statuses/update', { status: myTweet }, function(err, reply) {
        if (err) {
          console.log('error:', err);
        }
        else {
          console.log('reply:', reply);
        }
      });
      */
    }
  });
}

// Tweet every 60 minutes
setInterval(function () {
  try {
    tweet();
  }
  catch (e) {
    console.log(e);
  }
}, 1000 * 60 * 60);

// Tweet once on initialization
tweet();
