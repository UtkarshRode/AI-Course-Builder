const ProgressBar = ({ value = 0 }) => {

    return (
        <div className="progress-container">

            <div className="progress-track">

                <div
                    className="progress-fill"
                    style={{
                        width: `${value}%`
                    }}
                />

            </div>

            <span>
                {Math.round(value)}%
            </span>

        </div>
    );
};

export default ProgressBar;