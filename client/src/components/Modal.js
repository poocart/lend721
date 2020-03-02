import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Card } from 'rimble-ui';

const ModalComponent = ({
  show,
  content,
}) => (
  <Modal isOpen={show}>
    <Card maxWidth="520px" p={0}>
      {content}
    </Card>
  </Modal>
);

ModalComponent.propTypes = {
  show: PropTypes.bool.isRequired,
  content: PropTypes.node,
};

export default ModalComponent;
