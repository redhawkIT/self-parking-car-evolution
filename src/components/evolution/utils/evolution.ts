import { Generation, Genome } from '../../../lib/genetic';
import {
  CarLicencePlateType,
  CarsType,
  EngineOptionsType,
  SensorValuesType,
  WheelOptionsType
} from '../../world/types/car';
import { SENSORS_NUM } from '../../world/car/constants';

export const generateWorldVersion = (generationIndex: number | null, batchIndex: number | null): string => {
  const generation = generationIndex === null ? -1 : generationIndex;
  const batch = batchIndex === null ? -1: batchIndex;
  return `world-${generation}-${batch}`;
};

const generateLicencePlate = (genomeIndex: number): CarLicencePlateType => {
  return `CAR-${genomeIndex + 1}`;
};

export const generationToCars = (population: Generation): CarsType => {
  const cars: CarsType = {};
  population.forEach((genome: Genome, genomeIndex) => {
    const licencePlate = generateLicencePlate(genomeIndex);

    const onEngine = (sensors: SensorValuesType): EngineOptionsType => {
      const random = Math.random();
      if (random < 0.3) {
        return 'backwards';
      }
      if (random > 0.6) {
        return 'forward'
      }
      return 'neutral';
    };

    const onWheel =  (sensors: SensorValuesType): WheelOptionsType => {
      const random = Math.random();
      if (random < 0.3) {
        return 'left';
      }
      if (random > 0.6) {
        return 'straight'
      }
      return 'right';
    };

    cars[licencePlate] = {
      licencePlate,
      sensorsNum: SENSORS_NUM,
      onEngine,
      onWheel,
      onHit: () => {},
      onMove: () => {},
    };
  });
  return cars;
};
