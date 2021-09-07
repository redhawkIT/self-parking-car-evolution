import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE as BUTTON_SIZE } from 'baseui/button';
import { BiDownload, BiUpload } from 'react-icons/all';
import { saveAs } from 'file-saver';
import {
  Modal,
  ModalHeader,
  ModalBody,
  SIZE,
  ROLE
} from 'baseui/modal';
import { FileUploader } from 'baseui/file-uploader';
import { Notification, KIND as NOTIFICATION_KIND } from 'baseui/notification';

import Row from '../shared/Row';
import { Generation, Percentage, Probability } from '../../libs/genetic';

export type EvolutionCheckpoint = {
  dateTime: string,
  generationIndex: number,
  lossHistory: number[],
  avgLossHistory: number[],
  performanceBoost: boolean,
  generationSize: number,
  generationLifetime: number,
  carsBatchSize: number,
  mutationProbability: Probability,
  longLivingChampionsPercentage: Percentage,
  generation: Generation,
};

type EvolutionCheckpointSaverProps = {
  onRestoreFromCheckpoint: (checkpoint: EvolutionCheckpoint) => void,
  onCheckpointToFile: () => EvolutionCheckpoint,
};

function EvolutionCheckpointSaver(props: EvolutionCheckpointSaverProps) {
  const {
    onRestoreFromCheckpoint,
    onCheckpointToFile,
  } = props;

  const [showCheckpointModal, setShowCheckpointModal] = useState<boolean>(false);
  const [checkpointIsProcessing, setCheckpointIsProcessing] = useState<boolean>(false);
  const [checkpointErrorMessage, setCheckpointErrorMessage] = useState<string | null>(null);

  const onSaveEvolution = () => {
    const checkpoint: EvolutionCheckpoint = onCheckpointToFile();
    const fileName = `evolution-checkpoint--gen-${checkpoint.generationIndex}--size-${checkpoint.generationSize}.json`;
    const checkpointString: string = JSON.stringify(checkpoint);
    const checkpointBlob = new Blob(
      [checkpointString],
      { type: 'application/json' },
    );
    saveAs(checkpointBlob, fileName);
  };

  const onCheckpointModalOpen = () => {
    setCheckpointErrorMessage(null);
    setCheckpointIsProcessing(false);
    setShowCheckpointModal(true);
  };

  const onCheckpointModalClose = () => {
    setShowCheckpointModal(false);
  };

  const onCancelCheckpointUpload = () => {
    setCheckpointIsProcessing(false);
  };

  const onFileDrop = (acceptedFiles: File[]) => {
    try {
      setCheckpointIsProcessing(true);

      const onFileReaderLoaded = (event: Event) => {
        // @ts-ignore
        const checkpoint: EvolutionCheckpoint = JSON.parse(event.target.result);
        onRestoreFromCheckpoint(checkpoint);
        setCheckpointIsProcessing(false);
        onCheckpointModalClose();
      };
  
      const fileReader = new FileReader();
      fileReader.onload = onFileReaderLoaded;
      fileReader.readAsText(acceptedFiles[0]);
    } catch (error: any) {
      setCheckpointErrorMessage(error.message);
      setCheckpointIsProcessing(false);
    }
  };

  const checkpointError = checkpointErrorMessage ? (
    <Notification
      kind={NOTIFICATION_KIND.negative}
      overrides={{
        Body: {style: {width: 'auto'}},
      }}
    >
      {checkpointErrorMessage}
    </Notification>
  ) : null;

  const checkpointModal = (
    <Modal
      onClose={onCheckpointModalClose}
      closeable
      isOpen={showCheckpointModal}
      animate
      autoFocus
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Restore evolution from the checkpoint file</ModalHeader>
      <ModalBody>
        {checkpointError}
        <FileUploader
          onCancel={onCancelCheckpointUpload}
          onDrop={onFileDrop}
          accept="application/json"
          multiple={false}
          progressMessage={checkpointIsProcessing ? 'Processing...' : ''}
        />
      </ModalBody>
    </Modal>
  );

  return (
    <>
      <Row>
        <Block marginRight="5px">
          <Button
            startEnhancer={() => <BiDownload />}
            size={BUTTON_SIZE.compact}
            onClick={onSaveEvolution}
          >
            Save evolution
          </Button>
        </Block>

        <Block marginLeft="5px">
          <Button
            startEnhancer={() => <BiUpload />}
            size={BUTTON_SIZE.compact}
            onClick={onCheckpointModalOpen}
          >
            Restore evolution
          </Button>
        </Block>
      </Row>

      {checkpointModal}
    </>
  );
}

export default EvolutionCheckpointSaver;