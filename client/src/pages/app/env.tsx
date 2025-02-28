import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../../modules/layout/Header';
import {
  useAppByIdQuery,
  useEnvVarsQuery,
  useSetEnvVarMutation,
  useUnsetEnvVarMutation,
  EnvVarsDocument,
} from '../../generated/graphql';
import { useFormik } from 'formik';
import { Button, HeaderContainer } from '../../ui';
import { TrashBinIcon } from '../../ui/icons/TrashBinIcon';
import { Container, Heading } from '@chakra-ui/react';
import { useToast } from '../../ui/toast';
import { AppHeaderTabNav } from '../../modules/app/AppHeaderTabNav';
import { AppHeaderInfo } from '../../modules/app/AppHeaderInfo';

interface EnvFormProps {
  name: string;
  value: string;
  appId: string;
  isNewVar?: boolean;
}

export const EnvForm = ({ name, value, appId, isNewVar }: EnvFormProps) => {
  const [inputType, setInputType] = useState('password');
  const toast = useToast();
  const [
    setEnvVarMutation,
    { loading: setEnvVarLoading },
  ] = useSetEnvVarMutation();
  const [
    unsetEnvVarMutation,
    { loading: unsetEnvVarLoading },
  ] = useUnsetEnvVarMutation();

  const handleDeleteEnvVar = async (event: any) => {
    event.preventDefault();
    try {
      await unsetEnvVarMutation({
        variables: { key: name, appId },
        refetchQueries: [{ query: EnvVarsDocument, variables: { appId } }],
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formik = useFormik<{ name: string; value: string }>({
    initialValues: {
      name,
      value,
    },
    onSubmit: async (values) => {
      // TODO validate values
      try {
        await setEnvVarMutation({
          variables: { key: values.name, value: values.value, appId },
          refetchQueries: [{ query: EnvVarsDocument, variables: { appId } }],
        });

        if (isNewVar) {
          formik.resetForm();
        }
        toast.success('Environment variable set successfully');
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  return (
    //TODO Handle visual feedback on changing env
    //TODO Provide infos about env vars
    <form onSubmit={formik.handleSubmit} autoComplete="off" className="mt-2">
      <div className="grid sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <div className="mt-8">
          <input
            autoComplete="off"
            className="inline w-full max-w-xs bg-white border border-grey rounded py-3 px-3 text-sm leading-tight transition duration-200 focus:outline-none focus:border-black"
            id={isNewVar ? 'newVarName' : name}
            name="name"
            placeholder="Name"
            key={name}
            value={formik.values.name}
            onChange={formik.handleChange}
          />
        </div>
        <div className="mt-8">
          <input
            autoComplete="off"
            onMouseEnter={() => setInputType('text')}
            onMouseLeave={() => setInputType('password')}
            onFocus={() => setInputType('text')}
            onBlur={() => setInputType('password')}
            className={`inline w-full max-w-xs bg-white border border-grey rounded py-3 px-3 text-sm leading-tight transition duration-200 focus:outline-none focus:border-black`}
            id={isNewVar ? 'newVarValue' : value}
            name="value"
            placeholder="Value"
            key={value}
            value={formik.values.value}
            onChange={formik.handleChange}
            type={inputType}
          />
        </div>
        <div className="flex items-end">
          <Button isLoading={setEnvVarLoading} type="submit" color="grey">
            {isNewVar ? 'Add' : 'Save'}
          </Button>
          {!isNewVar && (
            <Button
              isLoading={unsetEnvVarLoading}
              className="ml-2"
              color="red"
              onClick={handleDeleteEnvVar}
              variant="outline"
            >
              <TrashBinIcon size={24} />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export const Env = () => {
  const { id: appId } = useParams<{ id: string }>();
  const { data, loading /* error */ } = useAppByIdQuery({
    variables: {
      appId,
    },
    ssr: false,
    skip: !appId,
  });

  const {
    data: envVarData,
    loading: envVarLoading,
    error: envVarError,
  } = useEnvVarsQuery({
    variables: {
      appId,
    },
    fetchPolicy: 'network-only',
  });

  if (!data) {
    return null;
  }

  // // TODO display error

  if (loading) {
    // TODO nice loading
    return <p>Loading...</p>;
  }

  const { app } = data;

  if (!app) {
    // TODO nice 404
    return <p>App not found.</p>;
  }

  return (
    <div>
      <HeaderContainer>
        <Header />
        <AppHeaderInfo app={app} />
        <AppHeaderTabNav app={app} />
      </HeaderContainer>

      <Container maxW="5xl" mt={10}>
        <Heading as="h2" size="md" py={5}>
          Set env variables
        </Heading>
        <div className="mt-4 mb-4">
          <h2 className="text-gray-400">
            Before modifying any of these, make sure you are familiar with dokku
            env vars
          </h2>
        </div>

        {!envVarLoading && !envVarError && envVarData?.envVars.envVars && (
          <div className="mb-8">
            {envVarData.envVars.envVars.map((envVar) => {
              return (
                <EnvForm
                  key={envVar.key}
                  name={envVar.key}
                  value={envVar.value}
                  appId={appId}
                />
              );
            })}
            <EnvForm
              key="newVar"
              name=""
              value=""
              appId={appId}
              isNewVar={true}
            />
          </div>
        )}
      </Container>
    </div>
  );
};
