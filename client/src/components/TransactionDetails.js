import React from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
  Flex,
  Card,
  Box,
  Loader,
  Icon,
  Text,
  Link,
  Heading,
  Button,
  Flash,
} from 'rimble-ui';
import isEmpty from 'lodash/isEmpty';

// utils
import {
  getEtherscanHostname,
  truncateHexString,
} from '../utils';


const renderAddressRow = (title, address, url) => (
  <Flex
    justifyContent="space-between"
    bg="light-gray"
    p={[2, 3]}
    borderBottom="1px solid gray"
    borderColor="moon-gray"
    flexDirection={['column', 'row']}
  >
    <Text
      textAlign={['center', 'left']}
      color="near-black"
      fontWeight="bold"
    >
      {title}
    </Text>
    <Link
      href={url}
      target="_blank"
    >
      <Tooltip message={address}>
        <Flex
          justifyContent={['center', 'auto']}
          alignItems="center"
          flexDirection="row-reverse"
        >
          <Text fontWeight="bold">{truncateHexString(address)}</Text>
          <Flex
            mr={2}
            p={1}
            borderRadius="50%"
            bg="primary-extra-light"
            height="2em"
            width="2em"
            alignItems="center"
            justifyContent="center"
          >
            <Icon color="primary" name="RemoveRedEye" size="1em" />
          </Flex>
        </Flex>
      </Tooltip>
    </Link>
  </Flex>
);

const renderTextRow = (title, value, key) => (
  <Flex
    justifyContent="space-between"
    bg="near-white"
    p={[2, 3]}
    alignItems="center"
    flexDirection={['column', 'row']}
    borderBottom="1px solid gray"
    borderColor="moon-gray"
    key={key}
  >
    <Text color="near-black" fontWeight="bold" style={{ flexBasis: '50%' }}>
      {title}
    </Text>
    <Text color="mid-gray" style={{ flexBasis: '50%', textAlign: 'right' }}>{value}</Text>
  </Flex>
);

const TransactionDetails = ({
  senderAddress,
  receiverAddress,
  tokenId,
  tokenName,
  transactionHash,
  title,
  subtitle,
  actionConfirmTitle,
  actionCloseTitle,
  onConfirm,
  onClose,
  data,
  confirmDisabled,
  warningMessage,
  infoMessage,
}) => (
  <Card borderRadius={1} p={0}>
    <Flex
      justifyContent="center"
      alignItems="center"
      borderBottom={1}
      borderColor="#E8E8E8"
      p={[3, 4]}
      pb={3}
    >
      <Heading textAlign="center" as="h1" fontSize={[2, 3]} mx={[0, 3]}>{title}</Heading>
    </Flex>
    <Box p={[3, 4]}>
      <Flex justifyContent="space-between" flexDirection="column">
        <Text textAlign="center">{subtitle}</Text>
        <Flex
          alignItems="stretch"
          flexDirection="column"
          borderRadius={2}
          borderColor="moon-gray"
          borderWidth={1}
          borderStyle="solid"
          overflow="hidden"
          my={[3, 4]}
        >
          <Box bg="primary" px={3} py={2}>
            <Text color="white">Transaction</Text>
          </Box>
          {transactionHash && (
            <Flex
              p={3}
              borderBottom="1px solid gray"
              borderColor="moon-gray"
              alignItems="center"
              flexDirection={['column', 'row']}
            >
              <Box
                position="relative"
                height="2em"
                width="2em"
                mr={[0, 3]}
                mb={[3, 0]}
              >
                <Box position="absolute" top="0" left="0">
                  <Loader size="2em" />
                </Box>
              </Box>
              <Box>
                <Text
                  textAlign={['center', 'left']}
                  fontWeight="600"
                  fontSize={1}
                  lineHeight="1.25em"
                >
                  Waiting for confirmation...
                </Text>
                <Link
                  fontWeight={100}
                  lineHeight="1.25em"
                  color="primary"
                  href={`${getEtherscanHostname()}/tx/${transactionHash}`}
                  target="_blank"
                >
                  Preview transaction on Etherscan <Icon color="primary" name="Launch" size="1em" />
                </Link>
              </Box>
            </Flex>
          )}
          {renderAddressRow('Your account', senderAddress, `${getEtherscanHostname()}/address/${senderAddress}`)}
          {tokenName && renderTextRow('Token name', tokenName, 'tokenName')}
          {tokenId && renderTextRow('Token ID', tokenId, 'tokenId')}
          {data && data.map((row) => renderTextRow(row.title, row.render, row.key))}
        </Flex>
        {!isEmpty(warningMessage) && <Flash variant="warning">{warningMessage}</Flash>}
        {!isEmpty(infoMessage) && <Flash variant="info">{infoMessage}</Flash>}
      </Flex>
    </Box>
    <Flex
      px={4}
      py={3}
      borderTop={1}
      borderColor="#E8E8E8"
      justifyContent="flex-end"
    >
      <Button.Outline onClick={onClose}>{actionCloseTitle}</Button.Outline>
      {!transactionHash && (
        <Button
          ml={3}
          disabled={confirmDisabled}
          onClick={confirmDisabled ? () => {} : onConfirm}
        >
          {actionConfirmTitle}
        </Button>
      )}
    </Flex>
  </Card>
);

const DataPropType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  render: PropTypes.node.isRequired,
  key: PropTypes.node.isRequired,
});

TransactionDetails.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actionConfirmTitle: PropTypes.string,
  actionCloseTitle: PropTypes.string,
  transactionHash: PropTypes.string,
  senderAddress: PropTypes.string,
  receivedAddress: PropTypes.string,
  tokenName: PropTypes.string,
  tokenId: PropTypes.string,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  data: PropTypes.arrayOf(DataPropType),
  confirmDisabled: PropTypes.bool,
  warningMessage: PropTypes.string,
  infoMessage: PropTypes.string,
};

export default TransactionDetails;
