import React from "react";

export const InjectElementIntoJSX = ({
  children,
  element,
  start,
  end,
}: { 
  children: React.ReactNode, 
  element: JSX.Element
  start?: boolean,
  end?: boolean,
}) => {
  const newArray = [children];

  if (start)
    newArray.unshift(element);

  if (end)
    newArray.push(element);

  return <>{React.Children.toArray(newArray)}</>;
}