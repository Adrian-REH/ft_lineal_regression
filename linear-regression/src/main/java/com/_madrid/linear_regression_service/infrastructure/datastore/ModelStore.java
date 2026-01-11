package com._madrid.linear_regression_service.infrastructure.datastore;

import com._madrid.linear_regression_service.Model.Rect;
import com._madrid.linear_regression_service.Model.TrainCTX;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Repository
public class ModelStore {
    private final AtomicReference<ModelState> state = new AtomicReference<ModelState>(ModelState.NONE);
    private final AtomicReference<TrainCTX> trainCtxAtomic = new AtomicReference<>(new TrainCTX(List.of(),1000,0.01,0, List.of(), List.of()));
    private final AtomicReference<Rect> rect = new AtomicReference<>(new Rect(0.0, 0.0, 0));

    public void updateState(ModelState newState) {
        state.set(newState);
    }

    public TrainCTX getTrainCtx() {
        return trainCtxAtomic.get();
    }
    public void setTrainCtx(TrainCTX ctx) {
        trainCtxAtomic.set(ctx);
    }

    public ModelState getModelState() {
        return state.get();
    }

    public void setCurrentRect(Rect lastValue) {
        rect.set(lastValue);
    }

    public Rect getRect() {
        return rect.get();
    }


    public TrainCTX reset() {
        state.set(ModelState.NONE);
        trainCtxAtomic.set(new TrainCTX(List.of(),1000,0.01,0, List.of(), List.of()));
        rect.set(new Rect(0.0, 0.0, 0));
        return trainCtxAtomic.get();
    }
}
