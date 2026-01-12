package com._madrid.linear_regression_service.infrastructure.datastore;

public enum ModelState {
    NONE,
    TRAINING,
    TRAINED,
    ERROR_TRAIN,
    FILE_LOADING,
    FILE_PROCESSED,
    ERROR_FILE
}
