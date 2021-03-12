import styled from 'styled-components';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import uniqueId from 'lodash/uniqueId';
import { Loader } from 'rimble-ui';

// components
import Emoji from './Emoji';

// assets
import notFoundImage from '../assets/images/mystery.png';


const CardsWrapper = styled.div`
  display: flex;
  justify-content: space-even;
  margin-top: 30px;
  flex-wrap: wrap;
  align-items: flex-start;
  max-width: 790px;
  @media (max-width: 700px) {
    display: block;
  }
`;

const Card = styled.div`
  ${({ backgroundColor }) => backgroundColor && `background: #${backgroundColor};`}
  border: 1px solid #000;
  border-radius: 5px;
  text-align: center;
  flex: 0 0 200px;
  margin: 0px 15px 15px;
  padding: 10px;
  text-align: center;
  flex-wrap: wrap;
  position: relative;
`;

const DetailsButton = styled.div`
  display: none;
  position: absolute;
  background: #000; 
  padding: 8px 10px;
  border: 1px solid #3D0158;
  cursor: pointer;
  color: #fff;
  border-radius: 5px;
  overflow: hidden;
  left: 50px;
  top: 30%;
  &:hover {
    display: block;
    text-decoration: underline;
  }
`;

const CardImage = styled.img`
  max-width: 100%;
  display: inline-block;
  border-radius: 5px;
  &:hover ~ ${DetailsButton} {
    display: block;
  }
`;

const CardButton = styled.span`
  display: block;
  ${({ inverted }) => `
    background: ${inverted ? '#F9564F' : '#2d9f13'}; 
    &:hover { background: ${inverted ? '#bb342e' : '#02763a'}; }
  `}
  ${({ disabled }) => disabled && `
    background: #ddd; 
    &:hover { background: #ddd; }
  `}
  padding: 8px 10px;
  cursor: pointer;
  color: #fff;
  margin-top: 10px;
  border-radius: 5px;
  overflow: hidden;
`;

const MessageNotFound = styled.span`
  margin-top: 55px;
  font-size: 16px;
`;

const CardsGrid = ({
  data,
  onCardButtonClick,
  renderCardButtonTitle,
  invertedCardButton,
  checkIfDisabled,
}) => {
  const [tokenDetails, setTokenDetails] = useState({});
  if (data == null) return <Loader style={{ marginTop: 65 }} size="40px" />;
  return (
    <CardsWrapper>
      {isEmpty(data) && <MessageNotFound>Oops! Nothing found <Emoji size={32} content="🤷" /></MessageNotFound>}
      {!isEmpty(data) && data.map((item) => {
        const { image, backgroundColor } = item;
        const disabled = checkIfDisabled && checkIfDisabled(item);
        return (
          <Card key={`${uniqueId('card_')}`} backgroundColor={backgroundColor}>
            <CardImage src={image || notFoundImage} />
            {/*<DetailsButton onClick={() => setTokenDetails(data)}>Token Details</DetailsButton>*/}
            <CardButton
              inverted={invertedCardButton}
              onClick={() => disabled ? {} : onCardButtonClick(item)}
              disabled={disabled}
            >
              {renderCardButtonTitle(item)}
            </CardButton>
          </Card>
        );
      })}
    </CardsWrapper>
  );
};

const CardsGridDataPropType = PropTypes.arrayOf(PropTypes.shape({
  title: PropTypes.string,
  image: PropTypes.string,
}));

CardsGrid.propTypes = {
  data: CardsGridDataPropType,
  renderCardButtonTitle: PropTypes.func.isRequired,
  onCardButtonClick: PropTypes.func.isRequired,
  invertedCardButton: PropTypes.bool,
  checkIfDisabled: PropTypes.func,
};

export default CardsGrid;
