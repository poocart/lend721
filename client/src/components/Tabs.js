import React, { useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';


const TabsRow = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 25px;
  overflow: hidden;
  ${({ marginTop }) => marginTop && `margin-top: ${marginTop}px;`}
  justify-content: flex-start;
  align-items: center;
`;

const SingleTab = styled.a`
  background: #3D0158;
  padding: 15px 40px;
  cursor: pointer;
  font-size: 20px;
  &, &:visited, &:hover { color: #fff; }
  ${({ disabled }) => disabled ? 'opacity: 0.5;' : '&:hover { opacity: 0.8; }'}
  ${({ active, disabled }) => active && !disabled && `
    opacity: 0.8;
    font-weight: 800;
  `}
`;

const renderTab = (title, tabIndex, activeTab, setTab) => (
  <SingleTab
    active={activeTab === tabIndex}
    onClick={() => setTab(tabIndex)}
    key={tabIndex}
  >
    {title}
  </SingleTab>
);

const Tabs = (props) => {
  const [activeTab, setActiveTab] = useState(0);

  const { data, marginTop } = props;

  const tabContent = data[activeTab].content;

  return (
    <>
      <TabsRow marginTop={marginTop}>
        {data.map(({ title }, index) => renderTab(title, index, activeTab, setActiveTab))}
      </TabsRow>
      {tabContent}
    </>
  );
};

const TabDataPropType = PropTypes.arrayOf(PropTypes.shape({
  title: PropTypes.string.isRequired,
  content: PropTypes.node.isRequired,
}));

Tabs.propTypes = {
  data: TabDataPropType.isRequired,
  marginTop: PropTypes.number,
};

export default Tabs;
