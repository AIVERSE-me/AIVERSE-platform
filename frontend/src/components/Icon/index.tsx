import { HTMLAttributes } from 'react';

const ScissorOutlinedColored = (props: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span {...props} className={'anticon'}>
      <svg
        viewBox="64 64 896 896"
        focusable="false"
        data-icon="scissor"
        width="1em"
        height="1em"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              style={{
                stopColor: '#fa709a',
                stopOpacity: 1,
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: '#fee140',
                stopOpacity: 1,
              }}
            />
          </linearGradient>
        </defs>
        <path
          fill="url(#grad)"
          d="M567.1 512l318.5-319.3c5-5 1.5-13.7-5.6-13.7h-90.5c-2.1 0-4.2.8-5.6 2.3l-273.3 274-90.2-90.5c12.5-22.1 19.7-47.6 19.7-74.8 0-83.9-68.1-152-152-152s-152 68.1-152 152 68.1 152 152 152c27.7 0 53.6-7.4 75.9-20.3l90 90.3-90.1 90.3A151.04 151.04 0 00288 582c-83.9 0-152 68.1-152 152s68.1 152 152 152 152-68.1 152-152c0-27.2-7.2-52.7-19.7-74.8l90.2-90.5 273.3 274c1.5 1.5 3.5 2.3 5.6 2.3H880c7.1 0 10.7-8.6 5.6-13.7L567.1 512zM288 370c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80zm0 444c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"
        ></path>
      </svg>
    </span>
  );
};

const EthFilledWhite = () => {
  return (
    <svg
      className="icon"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
    >
      <path
        d="M512 64.223v369.743l-267.095 83.14L512 64.223zM512 64.223v369.743l267.095 83.14L512 64.223zM512 959.777V702.502L244.905 555.207 512 959.777zM512 959.777V702.502l267.095-147.295L512 959.777z"
        fill="#ffffff"
      ></path>
      <path
        d="M244.905 517.106L512 392.986v255.311L244.905 517.106zM779.095 517.106L512 392.986v255.311l267.095-131.191z"
        fill="#ffffff"
      ></path>
    </svg>
  );
};

const Loading = () => {
  return (
    <span style={{ fontSize: 64 }}>
      <svg
        version="1.1"
        id="L4"
        xmlns="http://www.w3.org/2000/svg"
        // xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 50 100"
        enableBackground="new 0 0 0 0"
        // xml:space="preserve"
        width="1em"
        height="1em"
      >
        <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
          <animate
            attributeName="opacity"
            dur="1s"
            values="0;1;0"
            repeatCount="indefinite"
            begin="0.1"
          />
        </circle>
        <circle fill="#fff" stroke="none" cx="26" cy="50" r="6">
          <animate
            attributeName="opacity"
            dur="1s"
            values="0;1;0"
            repeatCount="indefinite"
            begin="0.2"
          />
        </circle>
        <circle fill="#fff" stroke="none" cx="46" cy="50" r="6">
          <animate
            attributeName="opacity"
            dur="1s"
            values="0;1;0"
            repeatCount="indefinite"
            begin="0.3"
          />
        </circle>
      </svg>
    </span>
  );
};

const ClickFilled = (props: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span {...props}>
      <svg
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="4368"
        width="1em"
        height="1em"
      >
        <path
          d="M758.422 502.69c-25.825 0-46.764 20.939-46.764 46.764v-35.073c0-25.825-20.939-46.764-46.764-46.764-25.825 0-46.764 20.939-46.764 46.764v-23.382c0-25.825-20.939-46.764-46.764-46.764s-46.764 20.939-46.764 46.764V327.325c0-25.825-20.939-46.764-46.764-46.764-25.825 0-46.764 20.939-46.764 46.764v362.783l-32.573-47.606c-16.406-23.976-49.127-30.118-73.126-13.712-23.976 16.406-30.118 49.15-13.712 73.126 0 0 78.567 119.698 99.373 146.137 56.737 72.093 135.156 118.799 216.083 110.542 97.157-9.913 178.065-58.412 178.065-175.322v-233.82c0.002-25.825-20.937-46.763-46.762-46.763z"
          p-id="4369"
          fill="#ffffff"
        ></path>
        <path
          d="M343.111 507.408c12.256-12.733 11.869-32.991-0.865-45.247-52.178-50.221-71.981-124.603-51.681-194.119 14.409-49.344 47.505-90.307 93.191-115.341 45.687-25.034 98.023-30.886 147.366-16.476 102.664 29.98 161.797 137.894 131.817 240.558-4.954 16.964 4.782 34.733 21.747 39.687 16.963 4.953 34.732-4.783 39.687-21.748 19.201-65.754 11.465-135.383-21.784-196.061-33.25-60.678-87.773-104.669-153.526-123.871-65.754-19.2-135.384-11.465-196.061 21.785-60.678 33.25-104.669 87.773-123.871 153.526-13.186 45.153-13.743 93.102-1.613 138.665 12.13 45.563 36.456 86.887 70.346 119.506 6.208 5.975 14.202 8.944 22.187 8.944 8.395 0.001 16.779-3.282 23.06-9.808z"
          p-id="4370"
          fill="#ffffff"
        ></path>
      </svg>
    </span>
  );
};

const HDOutlined = (props: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span {...props} style={{ height: 'fit-content', ...(props.style || {}) }}>
      <svg
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
      >
        <path
          d="M838.144 805.88799999h-632.832c-40.448 0-73.728-33.28-73.728-73.728v-456.192c0-40.448 33.28-73.728 73.728-73.728H838.144c40.448 0 73.728 33.28 73.728 73.728v456.192c0 40.96-33.28 73.728-73.728 73.728zM205.312 253.43999999c-12.288 0-22.528 10.24-22.528 22.528v456.192c0 12.288 10.24 22.528 22.528 22.528H838.144c12.288 0 22.528-10.24 22.528-22.528v-456.192c0-12.288-10.24-22.528-22.528-22.528h-632.832z"
          fill="#ffffff"
          p-id="2407"
        ></path>
        <path
          d="M445.44 350.20799999h46.592v274.432H445.44v-121.856h-134.144v121.856H266.24v-274.432h45.056v112.64H445.44v-112.64zM649.728 623.61599999h-99.328v-274.432h101.888c89.088 1.024 134.144 47.104 135.168 137.728 2.56 93.696-43.008 139.264-137.728 136.704z m1.536-233.472h-55.808V586.23999999h54.272c61.952 1.024 92.16-31.744 91.648-98.304-1.024-64-31.232-96.768-90.112-97.792z"
          fill="#ffffff"
          p-id="2408"
        ></path>
      </svg>
    </span>
  );
};

const FourKOutlined = (props: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span {...props} style={{ height: 'fit-content', ...(props.style || {}) }}>
      <svg
        style={{ display: 'block' }}
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="6312"
        width="1em"
        height="1em"
      >
        <path
          d="M170.666667 213.333333v597.333334h682.666666V213.333333H170.666667zM128 128h768a42.666667 42.666667 0 0 1 42.666667 42.666667v682.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H128a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z m362.666667 448h-42.666667V640H384v-64H256V384h64v128H384V384h64v128h42.666667v64zM768 640h-74.666667l-74.666666-96V640H554.666667V384h64v96L693.333333 384H768l-96 128L768 640z"
          p-id="6313"
          fill="#ffffffD8"
        ></path>
      </svg>
    </span>
  );
};

const RepaintFilled = (props: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span {...props} style={{ height: 'fit-content', ...(props.style || {}) }}>
      <svg
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="77207"
        width="1em"
        height="1em"
      >
        <path
          d="M223 980.8c-67.8 0-138-35.6-179-90.8-1.8-2.6-3.4-5.2-4.4-8.2-1.2-3-1.8-6-2-9-0.2-3.2-0.2-6.2 0.4-9.2 0.6-3 1.6-6 3-8.8 1.4-2.8 3.2-5.4 5.2-7.6 2.2-2.4 4.6-4.2 7.2-6 2.6-1.6 5.4-2.8 8.6-3.8 3-0.8 6-1.2 9.2-1.2 11.2 0 42.2-10.2 42.2-43.4 0-82.4 66.2-149.4 147.6-149.4s147.6 67 147.6 149.4c0 103.6-83.2 188-185.6 188z m238.8-253.2c-3.6 0-7-0.6-10.4-1.6-3-1-5.8-2.4-8.4-4.2-2.6-1.8-5-3.8-7-6.2-2-2.4-3.6-5-5-8-1.2-2.8-2.2-6-2.6-9-4.6-31.6-42-68.4-77.2-75.6-3-0.6-5.6-1.6-8.4-2.8-2.6-1.4-5-3-7.2-5s-4.2-4.2-5.8-6.6c-1.6-2.4-3-5.2-3.8-8-1-2.8-1.4-5.8-1.6-8.6-0.2-3 0-5.8 0.6-8.8 0.6-3 1.6-5.6 3-8.4 1.4-2.6 3-5 5-7.2l445.2-496c0.4-0.4 0.8-1 1.2-1.4 2.8-2.8 5.6-5.4 8.6-7.8 3-2.4 6.2-4.8 9.4-7s6.6-4.2 10-6c3.4-1.8 7-3.4 10.6-5 3.6-1.4 7.2-2.8 11-4 3.8-1.2 7.6-2 11.4-2.8 3.8-0.8 7.6-1.4 11.6-1.8a112.66 112.66 0 0 1 23.2 0c3.8 0.4 7.8 1 11.6 1.8s7.6 1.8 11.4 2.8c3.8 1.2 7.4 2.4 11 4 3.6 1.4 7.2 3.2 10.6 5 3.4 1.8 6.8 3.8 10 6s6.4 4.4 9.4 7c3 2.4 6 5 8.6 7.8 2.8 2.8 5.4 5.6 7.8 8.6 2.4 3 4.8 6.2 7 9.4s4.2 6.6 6 10c1.8 3.4 3.6 7 5 10.6 1.4 3.6 2.8 7.2 4 11 1.2 3.8 2 7.6 2.8 11.4 0.8 3.8 1.4 7.6 1.8 11.6a112.66 112.66 0 0 1 0 23.2c-0.4 3.8-1 7.8-1.6 11.6-0.8 3.8-1.6 7.6-2.8 11.4-1.2 3.8-2.4 7.4-4 11-1.4 3.6-3.2 7.2-5 10.6s-3.8 6.8-6 10-4.4 6.4-7 9.4c-2.4 3-5 6-7.8 8.6L486 717.4c-3.2 3.4-6.8 5.8-11.2 7.6-4 1.6-8.4 2.6-13 2.6z"
          p-id="77208"
          fill="#ffffff"
        ></path>
      </svg>
    </span>
  );
};

export {
  ScissorOutlinedColored,
  EthFilledWhite,
  Loading,
  ClickFilled,
  HDOutlined,
  FourKOutlined,
  RepaintFilled,
};