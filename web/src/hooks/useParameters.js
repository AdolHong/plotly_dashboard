import { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import { useParamValues } from '../hooks/useVisualizerContext';
import { parseDynamicDate } from '../components/ParameterControls';

export const useParameters = (configLoaded, configParameters) => {
  const [parameters, setParameters] = useState([]);
  const { paramValues, setParamValues } = useParamValues();
  const [form] = Form.useForm();

  // 处理参数配置
  const processParameters = (params) => {
    if (!params) return;
    // 保存参数配置
    setParameters(params);
    
    // 设置默认参数值
    const defaultValues = {};
    params.forEach(param => {
      if (param.type === 'single_select' || param.type === 'single_input') {
        defaultValues[param.name] = param.default !== undefined ? param.default : '';
        // 处理动态日期
        defaultValues[param.name] = parseDynamicDate(defaultValues[param.name]);
      } else if (param.type === 'multi_select' || param.type === 'multi_input') {
        defaultValues[param.name] = param.default !== undefined ? param.default : [];
        // 处理动态日期
        defaultValues[param.name] = parseDynamicDate(defaultValues[param.name][0]);
      } else if (param.type === 'date_picker') {
        // 处理动态日期, 且转换成dayjs对象
        defaultValues[param.name] = param.default ? dayjs(parseDynamicDate(param.default)) : null;
      }
    });
    
    // 保存参数值
    setParamValues(defaultValues);
    form.setFieldsValue(defaultValues);
    
    return defaultValues;
  };

  useEffect(() => {
    if (configLoaded && configParameters) {
      processParameters(configParameters);

    }
  }, [configLoaded, configParameters]);


  // 处理参数值变化
  const handleParamChange = (name, value) => {
    const newParamValues = {
      ...paramValues,
      [name]: value
    };
    setParamValues(newParamValues);
    return newParamValues;
  };


  return {
    parameters,
    paramValues,
    form,
    handleParamChange
  };
};