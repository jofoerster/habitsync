package de.jntn.habit.syncserver.util;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.function.Consumer;
import java.util.function.Function;

public class Utils {
    public static <T> void ifNotNull(T value, Consumer<T> consumer) {
        if (value != null) {
            consumer.accept(value);
        }
    }

    public static <T, R> R ifNotNull(T value, Function<T, R> function, R defaultValue) {
        if (value != null) {
            return function.apply(value);
        } else {
            return defaultValue;
        }
    }
}
