import { createContext, useContext, useState } from 'react';

// Create contexts for option values and parameter values
const OptionValuesContext = createContext();
const ParamValuesContext = createContext();

// Provider component that wraps the application
export const VisualizerContextProvider = ({ children }) => {
  const [allOptionValues, setAllOptionValues] = useState({});
  const [paramValues, setParamValues] = useState({});

  // Function to update option value of a given index
  const handleOptionChange = (index, name, value) => {
    let newOptionValues = {...allOptionValues}
    // 如果index不存在，创建新的选项值对象
    if (!(index in allOptionValues)) {
      newOptionValues = {...allOptionValues,[index]: {}};
    }

    // 更新选项值
    newOptionValues = {
      ...newOptionValues,
      [index]: {...newOptionValues[index],[name]: value}
    };

    setAllOptionValues(newOptionValues);
    return newOptionValues[index];
  };

  // Function to update parameter values
  const handleParamChange = (name, value) => {
    const newParamValues = {
      ...paramValues,
      [name]: value
    };
    setParamValues(newParamValues);
    return newParamValues;
  };

  // Function to get option values for a given index
  const getOptionValues = (index) => {
    return allOptionValues[index] || {};
  };

  // Function to update option values
  const setOptionValues = (index, values) => {
    let newOptionValues = {...allOptionValues, [index]: values};
    setAllOptionValues(newOptionValues);
  };
  

  return (
    <ParamValuesContext.Provider value={{ paramValues, setParamValues, handleParamChange }}>
      <OptionValuesContext.Provider value={{ getOptionValues, setOptionValues, handleOptionChange, allOptionValues, setAllOptionValues}}>
        {children}
      </OptionValuesContext.Provider>
    </ParamValuesContext.Provider>
  );
};

// Custom hooks to use the contexts
export const useOptionValues = () => {
  const context = useContext(OptionValuesContext);
  if (!context) {
    throw new Error('useOptionValues must be used within a VisualizerContextProvider');
  }
  return context;
};

export const useParamValues = () => {
  const context = useContext(ParamValuesContext);
  if (!context) {
    throw new Error('useParamValues must be used within a VisualizerContextProvider');
  }
  return context;
};