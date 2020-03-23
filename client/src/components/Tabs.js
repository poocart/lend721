import React, { useEffect, useState } from 'react';
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
  padding: 15px 25px;
  cursor: pointer;
  font-size: 14px;
  &, &:visited, &:hover { color: #fff; text-decoration: none; }
  ${({ disabled }) => disabled ? 'opacity: 0.5;' : '&:hover { opacity: 0.8; }'}
  ${({ active, disabled }) => active && !disabled && `
    opacity: 0.8;
    font-weight: 800;
  `}
  @media (max-width: 700px) {
    font-size: 14px;
  }
`;

const renderTab = (title, tabIndex, activeTab, setActiveTab, link) => {
  let tabProps;
  if (link) {
    tabProps = {
      target: '_blank',
      href: link,
    };
  } else {
    tabProps = {
      onClick: () => setActiveTab(tabIndex),
    };
  }
  return (
    <SingleTab
      active={activeTab === tabIndex}
      key={tabIndex}
      {...tabProps}
    >
      {title}
    </SingleTab>
  );
}

const Tabs = ({
  data,
  marginTop,
  defaultActiveTabIndex,
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTabIndex || 0);

  useEffect(() => {
    if (data[activeTab].hidden) setActiveTab(0);
  }, [data]);

  const tabContent = data[activeTab].content;
  const renderTabs = data.map(({
    title,
    hidden,
    link,
  }, index) => !hidden && renderTab(title, index, activeTab, setActiveTab, link));

  return (
    <>
      <TabsRow marginTop={marginTop}>
        {renderTabs}
      </TabsRow>
      {tabContent}
    </>
  );
};

const TabDataPropType = PropTypes.arrayOf(PropTypes.shape({
  title: PropTypes.string.isRequired,
  content: PropTypes.node,
  hidden: PropTypes.bool,
}));

Tabs.propTypes = {
  data: TabDataPropType.isRequired,
  marginTop: PropTypes.number,
  defaultActiveTabIndex: PropTypes.number,
};

export default Tabs;
