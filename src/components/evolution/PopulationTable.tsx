import React from 'react';
import { Block } from 'baseui/block';
import { Table, DIVIDER, SIZE as TABLE_SIZE } from 'baseui/table-semantic';
import { Tag, VARIANT as TAG_VARIANT, KIND as TAG_KIND } from 'baseui/tag';
import { Spinner } from 'baseui/spinner';

import { CarLicencePlateType, CarsType, CarType } from '../world/types/car';
import { formatFitnessValue } from './utils/evolution';

export type CarsInProgressType = Record<CarLicencePlateType, boolean>;
export type CarsFitnessType = Record<CarLicencePlateType, number | null>;

type PopulationTableProps = {
  cars: CarsType,
  carsInProgress: CarsInProgressType,
  carsFitness: CarsFitnessType,
};

const sortTable = true;

function PopulationTable(props: PopulationTableProps) {
  const { cars, carsInProgress, carsFitness } = props;
  const carsArray: CarType[] = Object.values<CarType>(cars);

  const columns = [
    'Licence Plate',
    'Distance',
  ];

  const rowsData: React.ReactNode[][] = carsArray
    .sort((carA: CarType, carB: CarType): number => {
      if (!sortTable) {
        return 0;
      }
      const fitnessA = getCarFitness(carsFitness, carA);
      const fitnessB = getCarFitness(carsFitness, carB);
      if (fitnessA === null && fitnessB !== null) {
        return 1;
      }
      if (fitnessA !== null && fitnessB === null) {
        return -1;
      }
      if (fitnessA === null || fitnessB === null) {
        return 0;
      }
      if (fitnessA === fitnessB) {
        return 0;
      }
      if (fitnessA <= fitnessB) {
        return -1;
      }
      return 1;
    })
    .map((car: CarType) => {
      const licencePlateCell = (
        <Tag
          closeable={false}
          kind={TAG_KIND.neutral}
          variant={TAG_VARIANT.light}
        >
          {car.licencePlate}
        </Tag>
      );

      const carFitnessFormatted: number | null = getCarFitness(carsFitness, car);
      let carFitnessColor = '';
      if (carFitnessFormatted !== null) {
        if (carFitnessFormatted < 1) {
          carFitnessColor = 'limegreen';
        } else if (carFitnessFormatted < 2) {
          carFitnessColor = 'orange';
        } else {
          carFitnessColor = 'red';
        }
      }
      const fitnessCell = carsInProgress[car.licencePlate] ? (
        <Spinner size={24} color="black" />
      ) : (
        <Block color={carFitnessColor}>
          {carFitnessFormatted}
        </Block>
      );

      return [
        licencePlateCell,
        fitnessCell,
      ];
    });

  return (
    <Block>
      <Table
        columns={columns}
        data={rowsData}
        emptyMessage="No population yet"
        divider={DIVIDER.grid}
        size={TABLE_SIZE.compact}
        overrides={{
          Root: {
            style: {
              maxHeight: '300px',
            },
          },
          TableBodyCell: {
            style: {
              verticalAlign: 'center',
            },
          },
        }}
      />
    </Block>
  );
}

function getCarFitness(carsFitness: CarsFitnessType, car: CarType): number | null {
  return carsFitness.hasOwnProperty(car.licencePlate) && typeof carsFitness[car.licencePlate] === 'number'
    ? formatFitnessValue(carsFitness[car.licencePlate])
    : null;
}

export default PopulationTable;
