import { useEffect, useState } from 'react';
import {
  getMarketResourcePrice,
  matchLora,
  matchStyle,
  removeModelFromPrompt,
  removeModelsFromPrompt,
} from '@/components/workshop/utils';
import { useModel } from '@@/exports';
import {
  useCreation,
  useDeepCompareEffect,
  useLocalStorageState,
  useMemoizedFn,
  useRequest,
} from 'ahooks';
import { getFineTunesByUniqueTokens } from '@/services/fine-tune';

const useWorkshop = () => {
  const { currentUser } = useModel('user', (state) => ({
    currentUser: state.currentUser,
  }));

  // const [personModel, setPersonModel] = useLocalStorageState<string>(
  //   'workshop.config.person-model',
  // );
  // const [styleModels, setStyleModels] = useLocalStorageState<string[]>(
  //   'workshop.config.style-models',
  //   {
  //     defaultValue: [],
  //   },
  // );

  const [personModel, setPersonModel] = useState<string>('');
  const [styleModels, setStyleModels] = useState<string[]>([]);

  const [personFineTune, setPersonFineTune] = useState<API.FineTune>();
  const [styleFineTunes, setStyleFineTunes] = useState<API.FineTune[]>([]);

  const [positivePrompt, setPositivePrompt] = useLocalStorageState<string>(
    'workshop.config.positive-prompt',
    { defaultValue: '' },
  );
  const [negativePrompt, setNegativePrompt] = useLocalStorageState(
    `workshop.config.negative-prompt`,
    {
      defaultValue: '',
    },
  );

  const clearPersonModel = useMemoizedFn(() => {
    setPositivePrompt(
      removeModelFromPrompt(personModel, positivePrompt, 'PERSON'),
    );
  });

  const clearStyleModels = useMemoizedFn(() => {
    setPositivePrompt(
      removeModelsFromPrompt(styleModels, positivePrompt, 'STYLE'),
    );
  });

  const price = useCreation(() => {
    let _price = 0;
    if (personFineTune?.marketResource) {
      _price += getMarketResourcePrice(personFineTune.marketResource);
    }
    for (const ft of styleFineTunes) {
      if (ft.marketResource) {
        _price += getMarketResourcePrice(ft.marketResource);
      }
    }
    return _price;
  }, [personFineTune, styleFineTunes]);

  useEffect(() => {
    const personModels = matchLora(positivePrompt);
    if (personModels.length > 0) {
      setPositivePrompt(
        removeModelsFromPrompt(
          personModels.slice(1, personModels.length),
          positivePrompt,
          'PERSON',
        ),
      );
    }
    setPersonModel(personModels[0] ?? '');
    setStyleModels(matchStyle(positivePrompt));
  }, [positivePrompt]);

  const handleSelectModel = useMemoizedFn(
    (uniqueToken: string, type: API.FineTuneType) => {
      if (type === 'PERSON') {
        if (personModel === uniqueToken) {
          setPositivePrompt(
            removeModelFromPrompt(uniqueToken, positivePrompt, type),
          );
        } else {
          const prompt = removeModelFromPrompt(
            personModel,
            positivePrompt,
            type,
          );
          setPositivePrompt(`${prompt}<lora:${uniqueToken}:1>`);
        }
      } else {
        if (styleModels.includes(uniqueToken)) {
          setPositivePrompt(
            removeModelFromPrompt(uniqueToken, positivePrompt, type),
          );
        } else {
          setPositivePrompt(`${positivePrompt}<${uniqueToken}>`);
        }
      }
    },
  );

  const { runAsync: validatePrompt } = useRequest(
    async () => {
      if (!currentUser) return false;
      let _prompt = positivePrompt;
      const _styleModels: (string | undefined)[] = [...styleModels];
      if (!!personModel) {
        const ft = (await getFineTunesByUniqueTokens([personModel]))[0];
        if (
          !ft ||
          (ft.creator !== currentUser.id &&
            (!ft.marketResource ||
              !ft.marketResource.published ||
              ft.marketResource.hidden))
        ) {
          _prompt = removeModelFromPrompt(personModel, _prompt, 'PERSON');
          setPersonModel('');
        } else {
          setPersonFineTune(ft);
        }
      } else {
        setPersonFineTune(undefined);
      }
      if (_styleModels.length > 0) {
        const fts = await getFineTunesByUniqueTokens(_styleModels as any);
        fts.forEach((ft, idx) => {
          if (
            !ft ||
            (ft.creator !== currentUser.id &&
              (!ft.marketResource ||
                !ft.marketResource.published ||
                ft.marketResource.hidden))
          ) {
            _prompt = removeModelFromPrompt(
              _styleModels[idx] as string,
              _prompt,
              'STYLE',
            );
            setStyleFineTunes((state) =>
              state.filter((e) => e.uniqueToken !== _styleModels[idx]),
            );
            _styleModels[idx] = undefined;
          }
        });
        setStyleModels(_styleModels.filter((e) => !!e) as any);
      } else {
        setStyleFineTunes([]);
      }

      const validate = _prompt === positivePrompt;
      setPositivePrompt(_prompt);
      return validate;
    },
    {
      refreshDeps: [currentUser],
      debounceWait: 500,
    },
  );

  useDeepCompareEffect(() => {
    validatePrompt();
  }, [personModel, styleModels]);

  return {
    personModel,
    styleModels,
    clearPersonModel,
    clearStyleModels,
    handleSelectModel,
    positivePrompt,
    setPositivePrompt,
    negativePrompt,
    setNegativePrompt,
    validatePrompt,
    price,
  };
};

export default useWorkshop;
