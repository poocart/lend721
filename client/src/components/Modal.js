import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Card } from 'rimble-ui';

const ModalComponent = ({
  show,
  content,
}) => (
  <Modal isOpen={show}>
    <Card maxWidth="420px" p={0}>
      {content}
      {/*<Button.Text*/}
      {/*  icononly*/}
      {/*  icon="Close"*/}
      {/*  color="moon-gray"*/}
      {/*  position="absolute"*/}
      {/*  top={0}*/}
      {/*  right={0}*/}
      {/*  mt={3}*/}
      {/*  mr={3}*/}
      {/*  onClick={() => onClose()}*/}
      {/*/>*/}
    </Card>
  </Modal>
);

ModalComponent.propTypes = {
  show: PropTypes.bool.isRequired,
  content: PropTypes.node,
};

export default ModalComponent;
