import React, { useEffect, useRef, useState } from 'react';
import { Block } from 'baseui/block';
import { useSnackbar, DURATION } from 'baseui/snackbar';
import { Check } from 'baseui/icon';
import { Notification } from 'baseui/notification';

import { Generation, Genome } from '../../libs/genetic';
import { CarLicencePlateType, CarType } from '../world/types/car';
import {
  SECOND,
  TRAINED_CAR_GENERATION_LIFETIME
} from './EvolutionBoardParams';
import { generationToCars } from './utils/evolution';
import { loggerBuilder } from '../../utils/logger';
import { BEST_GENOMES } from './constants/genomes';
import AutomaticParkingAnalytics from './AutomaticParkingAnalytics';
import World from '../world/World';
import ParkingAutomatic from '../world/parkings/ParkingAutomatic';

const defaultGenomeIndex = 0;

const bestDefaultTrainedGeneration: Generation = [
  BEST_GENOMES[defaultGenomeIndex],
];

function EvolutionTabAutomatic() {
  const {enqueue} = useSnackbar();

  const bestTrainedCarLossRef = useRef<number | null>(null);
  const onTrainedCarLossUpdate = (licensePlate: CarLicencePlateType, loss: number) => {
    bestTrainedCarLossRef.current = loss;
  };

  const [performanceBoost] = useState<boolean>(false);

  const [selectedGenomeIndex, setSelectedGenomeIndex] = useState<number>(defaultGenomeIndex);

  const [bestTrainedCarLoss, setBestTrainedCarLoss] = useState<number | null>(null);
  const [bestTrainedCarCycleIndex, setBestTrainedCarCycleIndex] = useState<number>(0);
  const [bestTrainedGeneration, setBestTrainedGeneration] = useState<Generation>(bestDefaultTrainedGeneration);
  const [bestTrainedCars, setBestTrainedCars] = useState<CarType[]>(
    Object.values(
      generationToCars({
        generation: bestDefaultTrainedGeneration,
        generationIndex: 0,
        onLossUpdate: onTrainedCarLossUpdate,
      })
    )
  );

  const automaticParkingLifetimeTimer = useRef<NodeJS.Timeout | null>(null);

  const logger = loggerBuilder({ context: 'AutomaticTab' });

  const automaticParkingCycleLifetimeMs = TRAINED_CAR_GENERATION_LIFETIME * SECOND;
  const automaticWorldVersion = `automatic-${bestTrainedCarCycleIndex}`;

  const onAutomaticCycleLifetimeEnd = () => {
    logger.info(`Automatic cycle #${bestTrainedCarCycleIndex} lifetime ended`);
    setBestTrainedCarLoss(bestTrainedCarLossRef.current);
    setBestTrainedCarCycleIndex(bestTrainedCarCycleIndex + 1);
  };

  const cancelAutomaticCycleTimer = () => {
    logger.info('Trying to cancel automatic parking cycle timer');
    if (automaticParkingLifetimeTimer.current === null) {
      return;
    }
    clearTimeout(automaticParkingLifetimeTimer.current);
    automaticParkingLifetimeTimer.current = null;
  };

  const countDownAutomaticParkingCycleLifetime = (onLifetimeEnd: () => void) => {
    logger.info(`Automatic parking cycle started`);
    cancelAutomaticCycleTimer();
    automaticParkingLifetimeTimer.current = setTimeout(onLifetimeEnd, automaticParkingCycleLifetimeMs);
  };

  const onBestGenomeEdit = (editedGenome: Genome) => {
    logger.info('Updating genome', editedGenome);

    const updatedGeneration: Generation = [editedGenome];

    setBestTrainedGeneration(updatedGeneration);

    setBestTrainedCars(Object.values(
      generationToCars({
        generation: updatedGeneration,
        generationIndex: 0,
        onLossUpdate: onTrainedCarLossUpdate,
      })
    ));

    bestTrainedCarLossRef.current = null;
    setBestTrainedCarLoss(null);
    setBestTrainedCarCycleIndex(bestTrainedCarCycleIndex + 1);

    countDownAutomaticParkingCycleLifetime(onAutomaticCycleLifetimeEnd);

    enqueue({
      message: 'Genome has been updated and applied to the displayed car',
      startEnhancer: ({size}) => <Check size={size} />,
    }, DURATION.medium);
  };

  const onChangeGenomeIndex = (index: number) => {
    setSelectedGenomeIndex(index);
    onBestGenomeEdit(BEST_GENOMES[index]);
  };

  // Start the automatic parking cycles.
  useEffect(() => {
    countDownAutomaticParkingCycleLifetime(onAutomaticCycleLifetimeEnd);
    return () => {
      cancelAutomaticCycleTimer();
    };
  }, [
    bestTrainedCarCycleIndex,
  ]);

  return (
    <Block>
      <World
        version={automaticWorldVersion}
        performanceBoost={performanceBoost}
      >
        <ParkingAutomatic
          performanceBoost={performanceBoost}
          cars={bestTrainedCars}
          withVisibleSensors
          withLabels
        />
      </World>
      <Block marginTop="20px">
        <Notification overrides={{Body: {style: {width: 'auto'}}}}>
          See the trained self-parking car in action<br/><br/>
          <small>You may also update genome values to see how it affects car's behavior</small>
        </Notification>
      </Block>
      <AutomaticParkingAnalytics
        genomes={BEST_GENOMES}
        bestGenome={bestTrainedGeneration[0]}
        minLoss={bestTrainedCarLoss}
        generationLifetimeMs={automaticParkingCycleLifetimeMs}
        batchVersion={automaticWorldVersion}
        carsBatchIndex={bestTrainedCarCycleIndex}
        onBestGenomeEdit={onBestGenomeEdit}
        selectedGenomeIndex={selectedGenomeIndex}
        onChangeGenomeIndex={onChangeGenomeIndex}
      />
    </Block>
  );
}

export default EvolutionTabAutomatic;
