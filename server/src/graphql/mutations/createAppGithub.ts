import { deployAppQueue } from './../../queues/deployApp';
import { sshConnect } from './../../lib/ssh';
import { MutationResolvers } from '../../generated/graphql';
import { Octokit } from '@octokit/rest';
import { prisma } from '../../prisma';
// import { buildAppQueue } from '../../queues/buildApp';
import {
  githubAppCreationSchema,
  getRepoData,
  generateRandomToken,
} from '../utils';
import { dokku } from '../../lib/dokku';

export const createAppGithub: MutationResolvers['createAppGithub'] = async (
  _,
  { input },
  { userId }
) => {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // We make sure the name is valid to avoid security risks
  githubAppCreationSchema.validateSync({
    name: input.name,
    gitRepoUrl: input.gitRepoUrl,
  });

  const apps = await prisma.app.findMany({
    where: {
      name: input.name,
    },
  });

  const isAppNameTaken = !!apps[0];

  if (isAppNameTaken) {
    throw new Error('App name already taken');
  }

  const octokit = new Octokit({});

  const repoData = getRepoData(input.gitRepoUrl);

  const repo = await octokit.repos.get({
    owner: repoData.owner,
    repo: repoData.repoName,
  });

  if (!repo) {
    throw new Error(
      `No repository found for ${repoData.owner} with name ${repoData.repoName}`
    );
  }

  const branch = await octokit.repos.getBranch({
    owner: repoData.owner,
    repo: repoData.repoName,
    branch: input.branchName ? input.branchName : 'main',
  });

  if (!branch.url) {
    throw new Error(
      `There's no ${input.branchName} branch or main branch for this repository`
    );
  }

  const ssh = await sshConnect();

  const dokkuApp = await dokku.apps.create(ssh, input.name);

  const randomToken = generateRandomToken(20);

  const app = await prisma.app.create({
    data: {
      name: input.name,
      type: 'GITHUB',
      AppMetaGithub: {
        create: {
          repoName: repoData.repoName,
          repoOwner: repoData.owner,
          repoId: repo.data.id.toString(),
          webhooksSecret: randomToken,
          branch: input.branchName ? input.branchName : 'main',
        },
      },
    },
    include: {
      AppMetaGithub: true,
    },
  });

  if (dokkuApp) {
    await deployAppQueue.add('deploy-app', {
      appId: app.id,
    });
  }

  // TODO enable again once we start the github app autodeployment
  // const appBuild = await prisma.appBuild.create({
  //   data: {
  //     status: 'PENDING',
  //     user: {
  //       connect: {
  //         id: userId,
  //       },
  //     },
  //     app: {
  //       connect: {
  //         id: app.id,
  //       },
  //     },
  //   },
  // });

  // // We trigger the queue that will add dokku to the server
  // await buildAppQueue.add('build-app', { buildId: appBuild.id });

  return { result: true };
};
