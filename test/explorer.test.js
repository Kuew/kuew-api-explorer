var loopback = require('loopback');
var explorer = require('../');
var request = require('supertest');
var assert = require('assert');
var expect = require('chai').expect;

describe('explorer', function() {

  describe('with default config', function() {
    beforeEach(givenLoopBackAppWithExplorer());

    it('should redirect to /explorer/', function(done) {
      request(this.app)
        .get('/explorer')
        .expect(303)
        .end(done);
    });

    it('should serve the explorer at /explorer/', function(done) {
      request(this.app)
        .get('/explorer/')
        .expect('Content-Type', /html/)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;

          assert(!!~res.text.indexOf('<title>Kuew API Explorer</title>'), 'text does not contain expected string');
          done();
        });
    });

    it('should serve correct swagger-ui config', function(done) {
      request(this.app)
        .get('/explorer/config.json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to
            .have.property('discoveryUrl', '/swagger/resources');
          done();
        });
    });
  });

  describe('with custom baseUrl', function() {
    beforeEach(givenLoopBackAppWithExplorer('/api'));

    it('should serve correct swagger-ui config', function(done) {
      request(this.app)
        .get('/explorer/config.json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to
            .have.property('discoveryUrl', '/api/swagger/resources');
          done();
        });
    });
  });

  describe('with custom app.restApiRoot', function() {
    it('should serve correct swagger-ui config', function(done) {
      var app = loopback();
      app.set('restApiRoot', '/rest-api-root');
      configureRestApiAndExplorer(app);

      request(app)
        .get('/explorer/config.json')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to
            .have.property('discoveryUrl', '/rest-api-root/swagger/resources');
          done();
        });
    });
  });

  function givenLoopBackAppWithExplorer(restUrlBase) {
    return function(done) {
      var app = this.app = loopback();
      configureRestApiAndExplorer(app, restUrlBase);
      done();
    };
  }

  function configureRestApiAndExplorer(app, restUrlBase) {
    var Product = loopback.Model.extend('product');
    Product.attachTo(loopback.memory());
    app.model(Product);

    if (restUrlBase) {
      app.use(restUrlBase, loopback.rest());
      app.use('/explorer', explorer(app, { basePath: restUrlBase }));
    } else {
      // LoopBack REST adapter owns the whole URL space and does not
      // let other middleware handle same URLs.
      // It's possible to circumvent this measure by installing
      // the explorer middleware before the REST middleware.
      // This way we can acess `/explorer` even when REST is mounted at `/`
      app.use('/explorer', explorer(app));
      app.use(app.get('restApiRoot') || '/', loopback.rest());
    }
  }
});
