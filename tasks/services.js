/*
 * grunt-services
 * https://github.com/thanpolas/grunt-services
 *
 * Copyright (c) 2014 Thanasis Polychronakis
 * Licensed under the MIT license.
 */
var exec = require('child_process').exec;

module.exports = function(grunt) {

  var log = grunt.log;


  function startService(serviceName, processName, command) {
    return function() {
      var done = this.async();
      isRunning(processName, function(running){
        if(running) {
          log.writeln([serviceName + ' is already running, moving on']);
          done(null, 1);
          return;
        }
        shellbg(command, function() {
          log.writeln([serviceName + ' is now up']);
          done();
        });

      });
    };
  }

  function downService(serviceName, command) {
    return function() {
      var done = this.async();
      exec(command, function(err) {
        if (err) {
          log.error(err);
          done();
          return;
        }
        log.writeln([serviceName + ' server down']);
        done();
      });
    };
  }

  grunt.registerTask('stopRedis', 'Kill reddis',
    downService('Redis', 'redis-cli shutdown'));
  grunt.registerTask('stopMongo', 'Kill mongodb',
    downService('Mongodb', 'mongo admin --eval "db.shutdownServer()"'));
  grunt.registerTask('stopPostgres', 'Kill Postgres',
    downService('Postgres', 'pg_ctl -D /usr/local/var/postgres stop -s -m fast'));

  grunt.registerTask('stopSidekiq', 'Kill Sidekiq',
    downService('Sidekiq', "ps -ef | grep sidekiq | grep -v grep | awk '{print $2}' | xargs kill -9"));
  grunt.registerTask('stopNgrok', 'Kill Ngrok',
    downService('Ngrok', "ps -ef | grep ngrok | grep -v grep | awk '{print $2}' | xargs kill -9"));


  grunt.registerTask('startRedis', 'Start Redis',
    startService('Redis', 'redis-server', 'redis-server'));
  grunt.registerTask('startMongo', 'Start Mongo',
    startService('Mongodb', 'mongod', 'mongod'));
  grunt.registerTask('startPostgres', 'Start Postgres',
    startService('Postgres', 'postgres',
    'pg_ctl -o "-h 127.0.0.1" -D /usr/local/var/postgres start'));

  grunt.registerTask('startSidekiq', 'Start Sidekiq',
    startService('Sidekiq', 'sidekiq', 'sidekiq -d -C config/sidekiq.yml -L log/sidekiq.log'));
  grunt.registerTask('startNgrok', 'Start Ngrok',
    startService('Ngrok', 'ngrok', 'ngrok -log=none -config=ngrok.yml start local > /dev/null &'));


  /**
   * Checks if the define process is running
   * @param  {string}  process The process.
   * @return {boolean} yes or no.
   */
  function isRunning(process, cb) {
    var checkCommand = 'ps ax|grep ' + process + '|grep -v grep|awk \'{print $1}\'';
    var execOptions = {};

    exec(checkCommand, execOptions, function( err, stdout ) {
      if ( err ) {
        cb(false);
        return;
      }
      if ( stdout ) {
        cb(true, stdout);
        return;
      }
      cb(false);
    });
  }

  /**
   * Run a shell process in the bg (ignoring the callback)
   * @param  {string}   command The command.
   * @param  {Function} cb      The callback, always called
   *                            with no params so async moves
   *                            on to next operation.
   */
  function shellbg(command, cb) {
    console.log("execing");
    exec(command, {}, function( err, out ) {
      if ( err ) {
        log.error( err );
        cb();
        return;
      }
    });
    log.ok(['Command:' + command.yellow + ' run successfully']);
    cb(); 
  }
};


