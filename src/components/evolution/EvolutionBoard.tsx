import React, { useEffect, useRef, useState } from 'react';
import { Block } from 'baseui/block';
import _ from 'lodash';

import { createGeneration, Generation, Genome } from '../../lib/genetic';
import Worlds, { EVOLUTION_WORLD_KEY } from '../world/Worlds';
import PopulationTable, { CarsFitnessType, CarsInProgressType } from './PopulationTable';
import { CarLicencePlateType, CarsType, CarType } from '../world/types/car';
import { generationToCars, GENOME_LENGTH } from './utils/evolution';
import { getIntSearchParam, setSearchParam } from '../../utils/url';
import { WORLD_SEARCH_PARAM, WORLD_TAB_INDEX_TO_NAME_MAP } from './constants/url';
import { getWorldKeyFromUrl } from './utils/url';
import EvolutionBoardParams, {
  DEFAULT_BATCH_SIZE,
  DEFAULT_GENERATION_LIFETIME,
  DEFAULT_GENERATION_SIZE,
  SECOND
} from './EvolutionBoardParams';
import EvolutionTiming from './EvolutionTiming';
import FitnessHistory from './FitnessHistory';
import GenomePreview from './GenomePreview';

const GENERATION_SIZE_URL_PARAM = 'generation-size';
const GROUP_SIZE_URL_PARAM = 'group-size';
const GENERATION_LIFETIME_URL_PARAM = 'generation-lifetime';

function EvolutionBoard() {
  const [worldIndex, setWorldIndex] = useState<number>(0);

  const [generationSize, setGenerationSize] = useState<number>(
    getIntSearchParam(GENERATION_SIZE_URL_PARAM, DEFAULT_GENERATION_SIZE)
  );
  const [generationIndex, setGenerationIndex] = useState<number | null>(null);
  const [generation, setGeneration] = useState<Generation>([]);
  const [generationLifetime, setGenerationLifetime] = useState<number>(
    getIntSearchParam(GENERATION_LIFETIME_URL_PARAM, DEFAULT_GENERATION_LIFETIME)
  );

  const [cars, setCars] = useState<CarsType>({});
  const [carsBatch, setCarsBatch] = useState<CarType[]>([]);
  const [carsBatchSize, setCarsBatchSize] = useState<number>(
    getIntSearchParam(GROUP_SIZE_URL_PARAM, DEFAULT_BATCH_SIZE)
  );
  const [carsBatchIndex, setCarsBatchIndex] = useState<number | null>(null);

  const [bestGenome, setBestGenome] = useState<Genome | null>(null);
  const [bestFitness, setBestFitness] = useState<number | null>(null);
  const [bestCarLicencePlate, setBestCarLicencePlate] = useState<CarLicencePlateType | null>(null);

  const [activeWorldKey, setActiveWorldKey] = React.useState<string | number>(getWorldKeyFromUrl(EVOLUTION_WORLD_KEY));

  const batchTimer = useRef<NodeJS.Timeout | null>(null);

  const carsFitnessRef = useRef<CarsFitnessType[]>([{}]);
  const [carsFitness, setCarsFitness] = useState<CarsFitnessType[]>([{}]);
  const [fitnessHistory, setFitnessHistory] = useState<number[]>([]);

  const carsBatchesTotal: number = Math.ceil(Object.keys(cars).length / carsBatchSize);
  const carsInProgress: CarsInProgressType = carsBatch.reduce((cars: CarsInProgressType, car: CarType) => {
    cars[car.licencePlate] = true;
    return cars;
  }, {});

  const generationLifetimeMs = generationLifetime * SECOND;

  const onWorldSwitch = (worldKey: React.Key): void => {
    setActiveWorldKey(worldKey);
    setSearchParam(WORLD_SEARCH_PARAM, WORLD_TAB_INDEX_TO_NAME_MAP[worldKey]);
    if (worldKey === EVOLUTION_WORLD_KEY) {
      setGenerationIndex(0);
    } else {
      onEvolutionReset();
    }
  };

  const onEvolutionReset = () => {
    cancelBatchTimer();
    setGeneration([]);
    setCarsBatch([]);
    setCars({});
    setCarsFitness([{}]);
    carsFitnessRef.current = [{}];
    setFitnessHistory([]);
    setWorldIndex(0);
    setGenerationIndex(null);
    setCarsBatchIndex(null);
  };

  const onEvolutionRestart = () => {
    cancelBatchTimer();
    setGeneration([]);
    setCarsBatch([]);
    setCars({});
    setCarsFitness([{}]);
    carsFitnessRef.current = [{}];
    setFitnessHistory([]);
    setWorldIndex(worldIndex + 1);
    setGenerationIndex(0);
    setCarsBatchIndex(null);
  };

  const onCarFitnessUpdate = (licensePlate: CarLicencePlateType, fitness: number) => {
    if (generationIndex === null) {
      return;
    }
    if (!carsFitnessRef.current[generationIndex]) {
      carsFitnessRef.current[generationIndex] = {};
    }
    carsFitnessRef.current[generationIndex][licensePlate] = fitness;
  };

  const onGenerationSizeChange = (size: number) => {
    setGenerationSize(size);
    setSearchParam(GENERATION_SIZE_URL_PARAM, `${size}`);
    onEvolutionRestart();
  };

  const onBatchSizeChange = (size: number) => {
    setCarsBatchSize(size);
    setSearchParam(GROUP_SIZE_URL_PARAM, `${size}`);
    onEvolutionRestart();
  };

  const onGenerationLifetimeChange = (time: number) => {
    setGenerationLifetime(time);
    setSearchParam(GENERATION_LIFETIME_URL_PARAM, `${time}`);
  };

  const cancelBatchTimer = () => {
    if (batchTimer.current === null) {
      return;
    }
    clearTimeout(batchTimer.current);
    batchTimer.current = null;
  };

  const syncBestGenome = () => {
    if (generationIndex === null) {
      return;
    }

    const generationFitness: CarsFitnessType = carsFitnessRef.current[generationIndex];
    if (!generationFitness) {
      return;
    }

    let bestCarLicensePlate: CarLicencePlateType | null = null;
    let minFitness: number = Infinity;
    let bestGenomeIndex: number = -1;

    Object.keys(generationFitness).forEach((licencePlate: CarLicencePlateType) => {
      const carFitness: number | null = generationFitness[licencePlate];
      if (carFitness === null) {
        return;
      }
      if (carFitness < minFitness) {
        minFitness = carFitness;
        bestCarLicensePlate = licencePlate;
        bestGenomeIndex = cars[licencePlate].generationIndex;
      }
    });

    if (bestGenomeIndex === -1) {
      return;
    }

    setBestFitness(minFitness);
    setBestGenome(generation[bestGenomeIndex]);
    setBestCarLicencePlate(bestCarLicensePlate);
  };

  const syncFitnessHistory = () => {
    if (generationIndex === null) {
      return;
    }
    const generationFitness: CarsFitnessType = carsFitnessRef.current[generationIndex];
    const newFitnessHistory = [...fitnessHistory];
    if (generationFitness) {
      newFitnessHistory[generationIndex] = Object.values(generationFitness).reduce(
        (minVal: number, currVal: number | null) => {
          if (currVal === null) {
            return minVal;
          }
          return Math.min(minVal, currVal);
        },
        Infinity
      );
    } else {
      newFitnessHistory[generationIndex] = Infinity;
    }
    setFitnessHistory(newFitnessHistory);
  };

  // Start the evolution.
  useEffect(() => {
    setGenerationIndex(0);
  }, []);

  // Once generation index is changed we need to create (or mate) a new generation.
  useEffect(() => {
    if (generationIndex === null) {
      return;
    }
    if (generationIndex === 0) {
      // Create the very first generation.
      const generation: Generation = createGeneration({
        generationSize,
        genomeLength: GENOME_LENGTH,
      });
      setGeneration(generation);
      setBestGenome(generation[0]);
    } else {
      // Mate and mutate existing population.
      // @TODO: Mate and mutate.
      const newGeneration = [...generation];
      setGeneration(newGeneration);
    }
  }, [generationIndex, worldIndex]);

  // Once generation is changed we need to create cars.
  useEffect(() => {
    if (!generation || !generation.length) {
      return;
    }
    const cars = generationToCars({
      generation,
      generationIndex,
      onFitnessUpdate: onCarFitnessUpdate,
    });
    setCars(cars);
    setCarsBatchIndex(0);
  }, [generation]);

  // Once the cars batch index is updated we need to generate a cars batch.
  useEffect(() => {
    if (carsBatchIndex === null || generationIndex === null) {
      return;
    }
    if (!cars || !Object.keys(cars).length) {
      return;
    }
    if (carsBatchIndex >= carsBatchesTotal) {
      return;
    }
    const batchStart = carsBatchSize * carsBatchIndex;
    const batchEnd = batchStart + carsBatchSize;
    const carsBatch: CarType[] = Object.values(cars).slice(batchStart, batchEnd);
    setCarsBatch(carsBatch);
  }, [carsBatchIndex]);

  // Once the new cars batch is created we need to start generation timer.
  useEffect(() => {
    if (carsBatchIndex === null) {
      return;
    }
    if (!carsBatch || !carsBatch.length) {
      return;
    }
    cancelBatchTimer();
    batchTimer.current = setTimeout(() => {
      const nextBatchIndex = carsBatchIndex + 1;
      if (nextBatchIndex >= carsBatchesTotal) {
        setCarsBatch([]);
        if (generationIndex !== null) {
          setCarsBatchIndex(null);
          setGenerationIndex(generationIndex + 1);
        }
        return;
      }
      setCarsFitness(_.cloneDeep<CarsFitnessType[]>(carsFitnessRef.current));
      setCarsBatchIndex(nextBatchIndex);
      syncFitnessHistory();
      syncBestGenome();
    }, generationLifetimeMs);
  }, [carsBatch]);

  const batchVersion = generateWorldVersion(generationIndex, carsBatchIndex);

  const worlds = (
    <Block>
      <Worlds
        cars={carsBatch}
        activeWorldKey={activeWorldKey}
        onWorldSwitch={onWorldSwitch}
        version={batchVersion}
      />
    </Block>
  );

  const timingDetails = (
    <Block marginBottom="20px" marginTop="20px">
      <EvolutionTiming
        generationIndex={generationIndex}
        batchIndex={carsBatchIndex}
        batchVersion={batchVersion}
        worldVersion={`${worldIndex}`}
        generationLifetimeMs={generationLifetimeMs}
      />
    </Block>
  );

  const evolutionParams = (
    <Block marginBottom="20px">
      <EvolutionBoardParams
        generationSize={generationSize}
        batchSize={carsBatchSize}
        generationLifetime={generationLifetime}
        onGenerationSizeChange={onGenerationSizeChange}
        onBatchSizeChange={onBatchSizeChange}
        onGenerationLifetimeChange={onGenerationLifetimeChange}
      />
    </Block>
  );

  const fitnessHistoryChart = (
    <Block marginBottom="20px">
      <FitnessHistory history={fitnessHistory} />
    </Block>
  );

  const populationTable = (
    <Block>
      <PopulationTable
        cars={cars}
        carsInProgress={carsInProgress}
        carsFitness={
          generationIndex !== null && carsFitness[generationIndex]
            ? carsFitness[generationIndex]
            : {}
        }
      />
    </Block>
  );

  const bestGenomePreview = (
    <Block marginBottom="20px">
      <GenomePreview
        genome={bestGenome}
        licencePlate={bestCarLicencePlate}
        fitness={bestFitness}
      />
    </Block>
  );

  const evolutionAnalytics = activeWorldKey === EVOLUTION_WORLD_KEY ? (
    <>
      {timingDetails}
      {evolutionParams}
      <Block display="flex" flexDirection={['column', 'column', 'row-reverse']}>
        <Block flex={2} marginBottom="20px" marginLeft={['0px', '0px', '10px']}>
          {fitnessHistoryChart}
        </Block>
        <Block flex={1} marginBottom="20px" marginRight={['0px', '0px', '10px']}>
          {populationTable}
        </Block>
      </Block>
      {bestGenomePreview}
    </>
  ) : null;

  return (
    <Block>
      {worlds}
      {evolutionAnalytics}
    </Block>
  );
}

const generateWorldVersion = (
  generationIndex: number | null,
  batchIndex: number | null
): string => {
  const generation = generationIndex === null ? -1 : generationIndex;
  const batch = batchIndex === null ? -1: batchIndex;
  return `world-${generation}-${batch}`;
};

export default EvolutionBoard;
