import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import signupSchema from '../validation/signupSchema';
import { useTranslation } from "react-i18next";

const SignupPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [signupFailed, setSignupFailed] = useState(false);
  const { t } = useTranslation();

  if (token) return <Navigate to="/" />;



  const handleSubmit = async (values, { setSubmitting }) => {
    setSignupFailed(false);

    try {
      const response = await axios.post("/api/v1/signup", {
        username: values.username,
        password: values.password,
      });

      const { token: newToken, username } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("username", username);

      navigate("/");
    } catch (error) {
      if (error.response?.status === 409) {
        setSignupFailed(true);
      } else {
        console.error(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>{t("signup.title")}</h1>

      <Formik
        initialValues={{ username: "", password: "", confirmPassword: "" }}
validationSchema={signupSchema(t)}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="username">{t("signup.username")}</label>
              <Field id="username" name="username" type="text" />
              <ErrorMessage
                name="username"
                component="div"
                style={{ color: "red" }}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="password">{t("signup.password")}</label>
              <Field id="password" name="password" type="password" />
              <ErrorMessage
                name="password"
                component="div"
                style={{ color: "red" }}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="confirmPassword">{t("signup.confirmPassword")}</label>
              <Field id="confirmPassword" name="confirmPassword" type="password" />
              <ErrorMessage
                name="confirmPassword"
                component="div"
                style={{ color: "red" }}
              />
            </div>

            {signupFailed && (
              <div style={{ color: "red", marginBottom: "10px" }}>
                {t("signup.errorUserExists")}
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {t("signup.submit")}
            </button>
          </Form>
        )}
      </Formik>

      <div style={{ marginTop: "12px" }}>
        {t("signup.hasAccount")} <Link to="/login">{t("signup.login")}</Link>
      </div>
    </div>
  );
};

export default SignupPage;