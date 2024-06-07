// Мы ожидаем, что Вы исправите синтаксические ошибки, сделаете перехват возможных исключений и улучшите читаемость кода.
// А так же, напишите кастомный хук useThrottle и используете его там где это нужно.
// Желательно использование React.memo и React.useCallback там где это имеет смысл.
// Будет большим плюсом, если Вы сможете закэшировать получение случайного пользователя.
// Укажите правильные типы.
// По возможности пришлите Ваш вариант в https://codesandbox.io

import React, { memo, useCallback, useRef, useState } from "react";

const URL = "https://jsonplaceholder.typicode.com/users";

type TCompany = {
  bs: string;
  catchPhrase: string;
  name: string;
};

interface IGeo {
  lat: string;
  lng: string;
}

interface IAdress {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: IGeo;
}

type TUser = {
  id: number;
  email: string;
  name: string;
  phone: string;
  username: string;
  website: string;
  company: TCompany;
  address: IAdress;
};

interface IButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

const Button = memo(function ({ onClick }: IButtonProps): JSX.Element {
  console.log("button");
  return (
    <button type="button" onClick={onClick}>
      get random user
    </button>
  );
});

interface IUserInfoProps {
  user: TUser;
}

function UserInfo({ user }: IUserInfoProps): JSX.Element {
  console.log("UserInfo");
  return (
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Phone number</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{user.name}</td>
          <td>{user.phone}</td>
        </tr>
      </tbody>
    </table>
  );
}

function useThrottle(delay: number) {
  const timer = useRef<number | null>(null);

  return useCallback(
    (action: () => void) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        timer.current = null;
        action();
      }, delay);
    },
    [delay]
  );
}

function App(): JSX.Element {
  const [users, setUsers] = useState<Record<number, TUser>>({});
  const [current, setCurrent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trottle = useThrottle(500);

  const getUser = useCallback(async (id: number) => {
    const response = await fetch(`${URL}/${id}`);
    const _user = (await response.json()) as TUser;
    return _user;
  }, []);

  const receiveRandomUser = useCallback(() => {
    const randomId = 1; //Math.floor(Math.random() * (10 - 1)) + 1;
    console.log("randomId", randomId);
    if (!users[randomId]) {
      getUser(randomId)
        .then((user) => {
          const { id } = user;
          if (id) {
            setUsers((prevState) => ({ ...prevState, [id]: user }));
            setCurrent(id);
          } else {
            setError("No new user has been received.");
          }
        })
        .catch((e) => {
          setError("Data receiving error:" + e.message);
        });
    } else {
      setCurrent(randomId);
    }
  }, [getUser, users]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      trottle(receiveRandomUser);
    },
    [trottle, receiveRandomUser]
  );

  console.log("app");

  return (
    <div>
      <header>Get a random user</header>
      {error}
      <Button onClick={handleButtonClick} />
      {current && !error ? (
        <UserInfo user={users[current]} />
      ) : (
        <div>No current user</div>
      )}
    </div>
  );
}

export default App;
