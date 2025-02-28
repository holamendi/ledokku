import { randomBytes } from 'crypto';
import * as yup from 'yup';
import { DatabaseTypes } from '../generated/graphql';

// Digital ocean token format = exactly 64 chars, lowercase letters & numbers
export const digitalOceanAccessTokenRegExp = /^[a-z0-9]{64}/;

// Validate the name to make sure there are no security risks by adding it to the ssh exec command.
// Only letters and "-" allowed
// TODO unit test this schema
const appNameYup = yup
  .string()
  .required()
  .matches(/^[a-z0-9-]+$/);

// Regexp for git URLs
const gitRepoUrlYup = yup
  .string()
  .matches(
    /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/,
    'Must be a valid git link'
  )
  .required();

export const githubAppCreationSchema = yup.object({
  name: appNameYup,
  gitRepoUrl: gitRepoUrlYup,
});

export const appNameSchema = yup.object({
  name: appNameYup,
});

export const dbTypeToDokkuPlugin = (dbType: DatabaseTypes): string => {
  switch (dbType) {
    case 'MONGODB':
      return 'mongo';
    case 'POSTGRESQL':
      return 'postgres';
    case 'REDIS':
      return 'redis';
    case 'MYSQL':
      return 'mysql';
  }
};

// Extracts github repo owner and name
export const getRepoData = (gitRepoUrl: string) => {
  const base = gitRepoUrl.replace('https://github.com/', '');
  const split = base.split('/');
  const owner = split[0];
  const repoName = split[1].replace('.git', '');

  return {
    owner,
    repoName,
  };
};

export const generateRandomToken = (length = 40): string =>
  randomBytes(length).toString('hex');
