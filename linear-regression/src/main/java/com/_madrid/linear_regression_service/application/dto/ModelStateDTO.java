package com._madrid.linear_regression_service.application.dto;

import com._madrid.linear_regression_service.infrastructure.datastore.ModelState;

public class ModelStateDTO {
    private ModelState modelState;

    public ModelStateDTO(ModelState modelState) {
        this.modelState = modelState;
    }

    public ModelState getModelState() {
        return modelState;
    }

    public void setModelState(ModelState modelState) {
        this.modelState = modelState;
    }
}
