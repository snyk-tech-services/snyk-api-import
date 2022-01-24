import { exec } from 'child_process';
import { sep } from 'path';
import { deleteFiles } from '../delete-files';
const main = './dist/index.js'.replace(/\//g, sep);

describe('`snyk-api-import orgs:data <...>`', () => {
  const OLD_ENV = process.env;
  afterAll(async () => {
    process.env = { ...OLD_ENV };
  });
  it('Shows help text as expected', (done) => {
    exec(
      `node ${main} orgs:data help`,
      {
        env: {
          PATH: process.env.PATH,
          GITHUB_TOKEN: process.env.GH_TOKEN,
          SNYK_LOG_PATH: __dirname,
        },
      },
      (err, stdout, stderr) => {
        if (err) {
          throw err;
        }
        expect(stderr).toEqual('');
        expect(err).toBeNull();
        expect(stdout.trim()).toMatchSnapshot();
        done();
      },
    );
  });

  it('Generates orgs data as expected', (done) => {
    const groupId = 'hello';
    exec(
      `node ${main} orgs:data --source=github --groupId=${groupId}`,
      {
        env: {
          PATH: process.env.PATH,
          GITHUB_TOKEN: process.env.GH_TOKEN,
          SNYK_LOG_PATH: __dirname,
        },
      },
      (err, stdout, stderr) => {
        if (err) {
          throw err;
        }
        expect(stderr).toEqual('');
        expect(err).toBeNull();
        expect(stdout.trim()).toMatchSnapshot();
        deleteFiles([`group-${groupId}-github-com-orgs.json`]);
        done();
      },
    );
  }, 20000);
  it('Generates orgs data as expected for Gitlab', (done) => {
    const groupId = 'hello';
    exec(
      `node ${main} orgs:data --source=gitlab --groupId=${groupId} --sourceUrl=${process.env.TEST_GITLAB_BASE_URL}`,
      {
        env: {
          PATH: process.env.PATH,
          GITLAB_TOKEN: process.env.TEST_GITLAB_TOKEN,
          SNYK_LOG_PATH: __dirname,
        },
      },
      (err, stdout, stderr) => {
        if (err) {
          throw err;
        }
        expect(stderr).toEqual('');
        expect(err).toBeNull();
        expect(stdout.trim()).toMatchSnapshot();
        deleteFiles([`group-${groupId}-gitlab-orgs.json`]);
        done();
      },
    );
  }, 20000);
  it('Generates orgs data as expected for Bitbucket Server', (done) => {
    const groupId = 'hello';
    exec(
      `node ${main} orgs:data --source=bitbucket-server --groupId=${groupId} --sourceUrl=${process.env.BBS_SOURCE_URL}`,
      {
        env: {
          PATH: process.env.PATH,
          BITBUCKET_SERVER_TOKEN: process.env.BBS_TOKEN,
          SNYK_LOG_PATH: __dirname,
        },
      },
      (err, stdout, stderr) => {
        if (err) {
          throw err;
        }
        expect(stderr).toEqual('');
        expect(err).toBeNull();
        expect(stdout.trim()).toMatchSnapshot();
        deleteFiles([`group-${groupId}-bitbucket-server-orgs.json`]);
        done();
      },
    );
  }, 20000);
  it('Shows error when missing groupId', (done) => {
    exec(`node ${main} orgs:data --source=github`, (err, stdout) => {
      expect(err).toMatchSnapshot();
      expect(stdout).toEqual('');
      done();
    });
  });
});
