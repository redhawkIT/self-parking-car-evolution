import * as React from 'react';
import { Block } from 'baseui/block';

import { Genome } from '../../lib/genetic';
import { CarLicencePlateType } from '../world/types/car';
import { Textarea, SIZE as TEXTAREA_SIZE} from 'baseui/textarea';
import { FormControl } from 'baseui/form-control';
import { formatLossValue } from './utils/evolution';
import { CAR_SENSORS_NUM, decodeGenome, FormulaCoefficients } from '../../lib/carGenetic';

type GenomePreviewProps = {
  title: string,
  genome: Genome | null,
  licencePlate?: CarLicencePlateType | null,
  loss?: number | null,
};

function GenomePreview(props: GenomePreviewProps) {
  const {title, genome, licencePlate, loss} = props;

  const genomeCaption = (
    <Block display="flex" flexDirection="row">
      {genome && (
        <Block marginRight="15px">
          Genes: <b>{genome.length}</b>
        </Block>
      )}
      {licencePlate && (
        <Block marginRight="15px">
          Licence plate: <b>{licencePlate}</b>
        </Block>
      )}
      {loss && (
        <Block>
          Loss: <b>{formatLossValue(loss)}</b>
        </Block>
      )}
    </Block>
  );

  const genomeString = (genome || []).join('');
  const genomeOutput = (
    <FormControl
      label={() => (
        <span>Car genome</span>
      )}
      caption={genomeCaption}
    >
      <Textarea
        value={genomeString}
        size={TEXTAREA_SIZE.compact}
      />
    </FormControl>
  );

  let decodedEngineFormula = null;
  let decodedWheelsFormula = null;
  if (genome) {
    const { engineFormulaCoefficients, wheelsFormulaCoefficients } = decodeGenome(genome);
    decodedEngineFormula = (
      <Coefficients
        label="Engine formula"
        caption={
          `Multipliers for ${CAR_SENSORS_NUM} car sensors that define the engine work (backward, neutral, forward)`
        }
        coefficients={engineFormulaCoefficients}
      />
    );
    decodedWheelsFormula = (
      <Coefficients
        label="Wheels formula"
        caption={
          `Multipliers for ${CAR_SENSORS_NUM} car sensors that define the wheels direction (left, straight, right)`
        }
        coefficients={wheelsFormulaCoefficients}
      />
    );
  }

  const blocksMarginBottom = '30px';

  return (
    <Block>
      <Block marginBottom={blocksMarginBottom}>
        {genomeOutput}
      </Block>

      <Block marginBottom={blocksMarginBottom}>
        {decodedEngineFormula}
      </Block>

      <Block marginBottom={blocksMarginBottom}>
        {decodedWheelsFormula}
      </Block>
    </Block>
  );
}

type CoefficientsProps = {
  label: string,
  caption: string,
  coefficients: FormulaCoefficients,
};

function Coefficients(props: CoefficientsProps) {
  const {coefficients, label, caption} = props;
  const coefficientsString = coefficients.map(formatCoefficient).join(', ');
  return (
    <Block>
      <FormControl
        label={() => label}
        caption={() => caption}
      >
        <CodeBlock>
          {coefficientsString}
        </CodeBlock>
      </FormControl>
    </Block>
  );
}

type CodeBlockProps = {
  children: React.ReactNode,
};

function CodeBlock(props: CodeBlockProps) {
  const {children} = props;
  return (
    <>
      <Block $style={{
        border: '1px dotted #CCCCCC',
        padding: '10px',
        borderRadius: '3px',
      }}>
        <code>
          {children}
        </code>
      </Block>
    </>
  );
}

function formatCoefficient(coefficient: number): number {
  return Math.ceil(coefficient * 100) / 100;
}

export default GenomePreview;
