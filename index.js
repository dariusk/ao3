var gim = require('google-images');
var exec = require('child_process').exec;
var fs = require('fs');
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

function getImages(first, second) {
  var dfd = _.Deferred();
  gim.search(first, { page:1, callback: function (err, images) {
    var url1 = _.pluck(images,'url').pick();
    ur1l = url1.replace(/\%3F.*/,'');
    gim.search(second, { page:1, callback: function (err, images) {
      var url2 = _.pluck(images,'url').pick();
      ur12 = url2.replace(/\%3F.*/,'');
      console.log(url1, url2);
      var filetype1 = url1.match(/\.\w\w\w\w?$/)[0].toLowerCase();
      var filetype2 = url2.match(/\.\w\w\w\w?$/)[0].toLowerCase();
      var stream1 = fs.createWriteStream('./1' + filetype1);
      var stream2 = fs.createWriteStream('./2' + filetype2);
      stream1.on('close', function() {
        var r = request(url2).pipe(stream2);
      });
      stream2.on('close', function() {
        console.log('done');
        dfd.resolve('./1' + filetype1, './2' + filetype2);
      });
      var r = request(url1).pipe(stream1);
    }});
  }});
  return dfd.promise();
}

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
  var result = [],
      resultCount = 0;
  _.each(urls, function (url) {
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        // parse stuff and resolve
        var fandom = $('h2.heading > a').text();
        fandom = fandom.replace(/[\-\(\:\&].*$/,'');
        if (fandom === 'Bandom') {
          fandom = '';
        }
        console.log(fandom);
        var names = $('#tag_category_character > ul > li').map(function(ind, el) { return($(el).text().replace(/\(.*\)/,'').trim())});
        names = _.map(names, function(name) {
          return {
            name: name,
            fandom: fandom
          };
        });
        result.push(names);
        resultCount++;
        if (result.length === urls.length) {
          result = _.flatten(result);
          var first = result.pick();
          var second = result.pick();
          getImages('"' + first.name + '" ' + first.fandom, '"' + second.name + '" ' + second.fandom)
            .done(function(file1, file2) {
              console.log(file1, file2);
              exec('mogrify -resize 200x200^ -gravity center -extent 200x200 ' + file1).on('close', function() {
                exec('mogrify -resize 200x200^ -gravity center -extent 200x200 ' + file2).on('close', function() {
                  exec('convert ' + file1 + ' ' + file2 + ' +append out.png').on('close', function() {
                    exec('composite -gravity center heart.gif out.png out2.png').on('close', function() {
                      exec('mv out2.png ~/Downloads');
                      console.log('done');
                    });
                  });
                });
              });

            });
          console.log(first.name + ' and ' + second.name);
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
